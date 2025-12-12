const button = document.getElementById("toggleTheme");
const reloadMessage = document.getElementById("reloadMessage");
const reloadButton = document.getElementById("reloadButton");

async function sendUpdateMessage(isEnabled) {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
        action: "TOGGLE_THEME",
        enabled: isEnabled
    }).catch(e => console.error("Could not send message to content script:", e));
  }
}

async function reloadActiveTab() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab.id) {
        chrome.tabs.reload(tab.id);
    }
}

function updateButton(isEnabled) {
    if (isEnabled) {
        button.textContent = "выключить";
        button.classList.remove("theme-disabled");
        button.classList.add("theme-enabled");
        reloadMessage.style.display = "none"; 
    } else {
        button.textContent = "включить";
        button.classList.remove("theme-enabled");
        button.classList.add("theme-disabled");
        reloadMessage.style.display = "block"; 
    }
}

chrome.storage.sync.get(["enabled"], (data) => {
    const isEnabled = data.enabled !== false;
    updateButton(isEnabled);
});

button.addEventListener("click", () => {
  chrome.storage.sync.get(["enabled"], (data) => {
    const wasEnabled = data.enabled !== false;
    const newEnabled = !wasEnabled;

    chrome.storage.sync.set({enabled: newEnabled}, () => {
      updateButton(newEnabled);
      sendUpdateMessage(newEnabled);
    });
  });
});

reloadButton.addEventListener("click", () => {
    reloadActiveTab();
    window.close();
});
