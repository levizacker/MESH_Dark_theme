// чел иди нахуй

const gitUrl = "https://github.com/levizacker/MESH_Dark_theme";

document.getElementById("openGit").addEventListener("click", () => {
    chrome.tabs.create({ url: gitUrl });
});

document.getElementById("showLicense").addEventListener("click", async () => {
    const view = document.getElementById("licenseView");
    const text = document.getElementById("licenseText");
    
    try {
        const response = await fetch(chrome.runtime.getURL("LICENSE"));
        text.textContent = await response.text();
    } catch (e) {
        text.textContent = "ошибка загрузки LICENSE";
    }
    
    view.classList.remove("hidden");
});

document.getElementById("backBtn").addEventListener("click", () => {
    document.getElementById("licenseView").classList.add("hidden");
});
