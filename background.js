// ВНИМАНИЕ: Замените ВАШ_НИК и ВАШ_РЕПОЗИТОРИЙ на реальные данные с GitHub!
// Ссылка должна вести на raw-версию файла manifest.json
const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/MrMails/Pyrus_Routing_Optimizer/main/manifest.json";

// Настраиваем проверку обновлений каждые 4 часа (240 минут)
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkUpdateAlarm", { periodInMinutes: 240 });
    checkForUpdates(); // Проверяем сразу при запуске/обновлении
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkUpdateAlarm") {
        checkForUpdates();
    }
});

async function checkForUpdates() {
    try {
        // Добавляем таймстамп (?t=...), чтобы браузер не брал старую версию из кэша
        let response = await fetch(GITHUB_MANIFEST_URL + "?t=" + Date.now());
        if (!response.ok) return;
        
        let remoteManifest = await response.json();
        
        let localVersion = chrome.runtime.getManifest().version;
        let remoteVersion = remoteManifest.version;

        if (isNewerVersion(localVersion, remoteVersion)) {
            // Сохраняем в память информацию, что есть новая версия
            chrome.storage.local.set({ updateAvailable: remoteVersion });
        } else {
            chrome.storage.local.remove('updateAvailable');
        }
    } catch (e) {
        console.log("Pyrus PRO Updater: Не удалось проверить обновления", e);
    }
}

// Умное сравнение версий (например, 1.5.3 и 1.6.0)
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