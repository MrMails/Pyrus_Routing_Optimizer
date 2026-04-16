const STORAGE_KEY = 'pyrus_pro_backups_v3';

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].url.includes("pyrus.com")) {
            document.body.innerHTML = "<p style='padding: 10px;'>Откройте маршрутизацию Pyrus, чтобы использовать расширение.</p>";
            return;
        }

        const tabId = tabs[0].id;
        const tabUrl = tabs[0].url;

        // Прямо в попапе определяем ID формы
        let match = tabUrl.match(/(?:wf|rg|id|form)[^\d]*(\d+)/i);
        const currentFormId = match ? match[1] : "default_form";

        const btnSave = document.getElementById('btn-save');
        const btnExport = document.getElementById('btn-export');
        const btnImport = document.getElementById('btn-import');
        const fileImport = document.getElementById('file-import');
        const checkboxAllForms = document.getElementById('checkbox-all-forms');
        const backupList = document.getElementById('backup-list');

        let allBackups = [];

        // 1. МГНОВЕННАЯ ЗАГРУЗКА НАПРЯМУЮ ИЗ БАЗЫ
        function loadBackups() {
            chrome.storage.local.get([STORAGE_KEY], function(result) {
                allBackups = result[STORAGE_KEY] || [];
                renderList();
            });
        }

        // 2. ОТРИСОВКА
        function renderList() {
            backupList.innerHTML = '';
            const showAll = checkboxAllForms ? checkboxAllForms.checked : false;
            const filteredBackups = allBackups.filter(b => showAll || b.formId === currentFormId);

            if (filteredBackups.length === 0) {
                backupList.innerHTML = "<p style='padding:10px;'>Пока нет сохранений для этой формы.</p>";
                return;
            }

            filteredBackups.forEach(backup => {
                const item = document.createElement('div');
                item.style.borderBottom = "1px solid #ccc";
                item.style.padding = "10px 0";
                item.style.marginBottom = "5px";

                item.innerHTML = `
                    <div style="margin-bottom: 5px;">
                        <strong>${backup.name}</strong> <br>
                        <span style="font-size: 10px; color: gray;">🗓 ${backup.date} | ID формы: ${backup.formId}</span>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-restore" data-id="${backup.id}">▶ Восстановить</button>
                        <button class="btn-rename" data-id="${backup.id}" data-name="${backup.name}">✏️</button>
                        <button class="btn-delete" data-id="${backup.id}">🗑️</button>
                    </div>
                `;
                backupList.appendChild(item);
            });
            attachItemListeners();
        }

        // 3. СЛУШАТЕЛИ КНОПОК
        function attachItemListeners() {
            // ВОССТАНОВИТЬ (Единственное, что мы отправляем на страницу)
            document.querySelectorAll('.btn-restore').forEach(btn => {
                btn.onclick = (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    chrome.tabs.sendMessage(tabId, { action: "RESTORE_BACKUP", backupId: id });
                    window.close(); // Закрываем попап, чтобы не мешать роботу
                };
            });

            // УДАЛИТЬ (Делаем сами, без страницы)
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    if(confirm("Точно удалить это сохранение?")) {
                        allBackups = allBackups.filter(b => b.id !== id);
                        chrome.storage.local.set({ [STORAGE_KEY]: allBackups }, renderList);
                    }
                };
            });

            // ПЕРЕИМЕНОВАТЬ
            document.querySelectorAll('.btn-rename').forEach(btn => {
                btn.onclick = (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    const oldName = e.target.getAttribute('data-name');
                    const newName = prompt("Введите новое имя:", oldName);
                    
                    if (newName && newName !== oldName) {
                        let target = allBackups.find(b => b.id === id);
                        if (target) target.name = newName;
                        chrome.storage.local.set({ [STORAGE_KEY]: allBackups }, renderList);
                    }
                };
            });
        }

        if (checkboxAllForms) checkboxAllForms.onchange = renderList;

        // СОХРАНИТЬ (Просим страницу считать DOM)
        if (btnSave) {
            btnSave.onclick = () => {
                const name = prompt("Как назовем это сохранение?", "Бекап от " + new Date().toLocaleDateString());
                if (!name) return;

                btnSave.innerText = "⏳ Сохраняю...";
                btnSave.disabled = true;

                chrome.tabs.sendMessage(tabId, { action: "SAVE_BACKUP", backupName: name }, (res) => {
                    btnSave.innerText = "💾 Сохранить маршрутизацию";
                    btnSave.disabled = false;
                    if (res && res.status === "OK") { loadBackups(); } 
                    else { alert("Ошибка сохранения."); }
                });
            };
        }

        // ЭКСПОРТ
        if (btnExport) {
            btnExport.onclick = () => {
                if (allBackups.length === 0) return alert("Нет данных для экспорта!");
                const dataStr = JSON.stringify(allBackups, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pyrus_backups_${new Date().getTime()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };
        }

        // ИМПОРТ (Мгновенный)
        if (btnImport && fileImport) {
            btnImport.onclick = () => fileImport.click();
            fileImport.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        if (!Array.isArray(importedData)) throw new Error("Неверный формат");
                        
                        // Объединяем без дубликатов
                        let merged = [...importedData, ...allBackups];
                        allBackups = Array.from(new Map(merged.map(item => [item.id, item])).values());
                        
                        chrome.storage.local.set({ [STORAGE_KEY]: allBackups }, () => {
                            alert("✅ Импорт успешно завершен!");
                            fileImport.value = ''; 
                            renderList();
                        });
                    } catch (err) { alert("❌ Ошибка файла: " + err.message); }
                };
                reader.readAsText(file);
            };
        }

        loadBackups();
    });
});