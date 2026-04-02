const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/MrMails/Pyrus_Routing_Optimizer/main/manifest.json";

// 1. ФОКУС ВКЛАДОК
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "focusTab" && sender.tab) {
        // Переключаем фокус на вкладку с Pyrus
        chrome.tabs.update(sender.tab.id, { active: true });
        // И делаем окно браузера активным (если было открыто в другом окне)
        chrome.windows.update(sender.tab.windowId, { focused: true });
    }
});

// 2. СИСТЕМА УВЕДОМЛЕНИЙ ОБ ОБНОВЛЕНИЯХ
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkUpdateAlarm", { periodInMinutes: 240 });
    checkForUpdates(); // Проверяем сразу при запуске
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkUpdateAlarm") {
        checkForUpdates();
    }
});

async function checkForUpdates() {
    try {
        let response = await fetch(GITHUB_MANIFEST_URL + "?t=" + Date.now());
        if (!response.ok) return;
        
        let remoteManifest = await response.json();
        
        let localVersion = chrome.runtime.getManifest().version;
        let remoteVersion = remoteManifest.version;

        if (isNewerVersion(localVersion, remoteVersion)) {
            chrome.storage.local.set({ updateAvailable: remoteVersion });
        } else {
            chrome.storage.local.remove('updateAvailable');
        }
    } catch (e) {
        console.log("Pyrus Routing Optimizer: Не удалось проверить обновления", e);
    }
}

function isNewerVersion(oldVer, newVer) {
    const oldParts = oldVer.split('.').map(Number);
    const newParts = newVer.split('.').map(Number);
    for (let i = 0; i < newParts.length; i++) {
        let a = oldParts[i] || 0;
        let b = newParts[i] || 0;
        if (a < b) return true;
        if (a > b) return false;
    }
    return false;
}