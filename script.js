(function() {
  "use strict";

  const CONFIG = {
    themeColor: "#1e1e1e",
    cssVars: {
      "--MH-Background": "#1e1e1e",
      "--MH-Background-Light": "#2b2b2b",
      "--MH-Color": "#e6e6e6",
      "--MH-BorderColor": "#33363a",
      "--NC-Background-Light": "#1e1e1e",
      "--NC-Border-Light": "#2b2b2b",
      "--MF-Background": "#1e1e1e",
      "--MF-Border": "#33363a",
      "--LM-layer-inverted": "#1e1e1e"
    },
    lightThreshold: 220
  };

  const root = document.documentElement;
  const DARK_NOBLE_FLAG = "data-dark-noble";
  function setFlag(isEnabled) {
    if (isEnabled) {
      root.setAttribute(DARK_NOBLE_FLAG, "1");
    } else {
      root.removeAttribute(DARK_NOBLE_FLAG);
    }
  }

  function setMetaTheme(isEnabled) {
    let meta = document.querySelector("meta[name=\"theme-color\"]");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = isEnabled ? CONFIG.themeColor : "";
  }

  function applyCssVars(isEnabled) {
    Object.entries(CONFIG.cssVars).forEach(([key, value]) => {
      if (isEnabled) {
        root.style.setProperty(key, value, "important");
      } else {
        root.style.removeProperty(key);
      }
    });
  }

  let observer = null;

  function isVeryLight(rgb) {
    if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") {
      return false;
    }
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return false;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const avg = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;

    return avg > CONFIG.lightThreshold;
  }

  function fixInlineBg(el) {
    if (!el || el.nodeType !== 1) return;

    try {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;

      if (isVeryLight(bg)) {
        el.style.setProperty("background-color", "#2b2b2b", "important");
        el.style.setProperty("color", "#e6e6e6", "important");
        el.style.setProperty("border-color", "#33363a", "important");
      }
    } catch(e) {
      console.warn("inline bg fix error", e);
    }
  }

  function scan(rootNode = document.body) {
    if (!rootNode) return;

    try {
      fixInlineBg(rootNode);
      rootNode.querySelectorAll("*").forEach(el => fixInlineBg(el));
    } catch(e) {
      console.warn("scan error:", e);
    }
  }

  const mutationObserverCallback = mutations => {
    const processed = new Set();

    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && !processed.has(n)) {
            processed.add(n);
            fixInlineBg(n);
            scan(n);
          }
        });
      }

      if (
        m.type === "attributes" &&
        m.attributeName === "style" &&
        !processed.has(m.target)
      ) {
        processed.add(m.target);
        fixInlineBg(m.target);
      }
    }
  };

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(mutationObserverCallback);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
  
  function applyTheme(active) {
    setFlag(active);
    setMetaTheme(active);
    applyCssVars(active);

    if (active) {
      scan();
      startObserver();
    } else {
      stopObserver();
    }
  }

  async function checkAndApplyTheme() {
    return new Promise(resolve => {
      chrome.storage.sync.get(["enabled"], data => {
        const active = data.enabled !== false;
        applyTheme(active);
        resolve();
      });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOGGLE_THEME") {
      applyTheme(request.enabled);
      sendResponse({ status: "done" });
    }
    return true;
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndApplyTheme);
  } else {
    checkAndApplyTheme();
  }
})();
