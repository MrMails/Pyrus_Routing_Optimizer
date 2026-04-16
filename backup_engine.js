(() => {
    if (window.pyrusProBackupEngineInitialized === "v19.0.0") return;
    window.pyrusProBackupEngineInitialized = "v19.0.0";

    function getTimestamp() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    }

    const debug = (msg, data = '') => console.log(`[${getTimestamp()}] 🐞 PRO v19: ${msg}`, data);
    const debugErr = (msg, data = '') => console.error(`[${getTimestamp()}] ❌ PRO ERR v19: ${msg}`, data);

    let missingUsersReport = new Set();
    const STORAGE_KEY = 'pyrus_pro_backups_v3';

    async function sleep(ms, context = "") {
        let ctxStr = context ? ` (${context})` : "";
        debug(`   -> [Таймер] Ждем ${ms}мс...${ctxStr}`);
        return new Promise(resolve => {
            let start = performance.now();
            function check() {
                if (performance.now() - start >= ms) resolve();
                else window.requestAnimationFrame(check); 
            }
            window.setTimeout(() => {
                if (performance.now() - start >= ms) resolve();
            }, ms);
            check();
        });
    }

    function forceBlur() {
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
    }

    function dispatchKey(element, keyName, keyCode) {
        if (!element) return;
        element.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, code: keyName, keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true, composed: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, code: keyName, keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true, composed: true }));
    }

    function gentleClick(element, elementName) {
        debug(`   -> [Клик] Нажимаем: ${elementName}`);
        forceBlur(); 
        if (element && element.scrollIntoView) element.scrollIntoView({ behavior: 'instant', block: 'center' });
        if (element) element.click();
    }

    function directClick(element, elementName) {
        debug(`   -> [Снайпер-Клик] Точный клик: ${elementName}`);
        if (element && element.scrollIntoView) element.scrollIntoView({ behavior: 'instant', block: 'center' });
        if (element) {
            element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            element.click();
        }
    }

    function simulateRealClick(element, elementName) {
        debug(`   -> [Меню-Клик] Выбираем: ${elementName}`);
        forceBlur();
        if (!element) return;
        if (element.scrollIntoView) element.scrollIntoView({ behavior: 'instant', block: 'center' });
        const eventOptions = { bubbles: true, cancelable: true, composed: true, view: window, buttons: 1 };
        ['pointerover', 'mouseenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
            let EventClass = type.startsWith('pointer') ? PointerEvent : MouseEvent;
            element.dispatchEvent(new EventClass(type, eventOptions));
        });
    }

    function getFreshCell(sIdx, rIdx, cIdx) {
        let step = document.querySelectorAll('.weWorkflowStep')[sIdx];
        if (!step) return null;
        let rule = step.querySelectorAll('.weRule')[rIdx];
        if (!rule) return null;
        return Array.from(rule.children)[cIdx];
    }

    function findAddRuleButton(domStep) {
        let stepContainer = domStep.closest('.weWorkflowStepContainer') || domStep;
        let addBtnElements = Array.from(stepContainer.querySelectorAll('span.IconButton__text, button'));
        let addBtnSpan = addBtnElements.find(el => {
            let text = (el.innerText || el.textContent || "").trim();
            return text === 'Добавить правило' || text === '+ Добавить правило';
        });
        return addBtnSpan ? (addBtnSpan.closest('button') || addBtnSpan) : null;
    }

    function waitForRuleCount(sIdx, currentCount, isDeletion = false, timeout = 5000) {
        debug(`   -> [Ожидание] Ждем изменения кол-ва правил (было: ${currentCount})...`);
        return new Promise((resolve) => {
            let step = document.querySelectorAll('.weWorkflowStep')[sIdx];
            if (!step) return resolve(false);
            let start = performance.now();

            function check() {
                let newCount = step.querySelectorAll('.weRule').length;
                if ((isDeletion && newCount < currentCount) || (!isDeletion && newCount > currentCount)) {
                    debug(`   -> [Ожидание] Успех: стало ${newCount} правил.`);
                    resolve(true); return;
                }
                if (performance.now() - start >= timeout) {
                    debug(`   -> [Ожидание] Таймаут! Правила не изменились.`);
                    resolve(false); return;
                }
                window.requestAnimationFrame(check);
            }
            check();
        });
    }

    async function handleConfirmModal() {
        debug(`   -> [Поиск] Ищем окно подтверждения...`);
        for (let i = 0; i < 4; i++) {
            await sleep(150, "Поиск модалки");
            let btns = Array.from(document.querySelectorAll('button'));
            let confirmBtn = btns.find(b => {
                let txt = (b.innerText || "").toLowerCase().trim();
                return (txt === 'удалить' || txt === 'да' || txt === 'подтвердить') && b.offsetParent !== null;
            });
            if (confirmBtn) {
                gentleClick(confirmBtn, "Кнопка Подтверждения");
                await sleep(500, "Ожидание закрытия"); 
                return true;
            }
        }
        debug(`   -> [Поиск] Окно не появилось.`);
        return false;
    }

    async function typeLikeHuman(sIdx, rIdx, cIdx, value) {
        let cell = getFreshCell(sIdx, rIdx, cIdx);
        if (!cell) return;
        let element = cell.querySelector('textarea') || cell.querySelector('input[type="text"]');
        if (!element) return;

        debug(`   -> [Действие] Вводим текст "${value}"`);
        
        gentleClick(element, "Активация текстового поля");
        await sleep(100, "Ждем инициализацию поля в React");

        cell = getFreshCell(sIdx, rIdx, cIdx);
        if (!cell) return;
        element = cell.querySelector('textarea') || cell.querySelector('input[type="text"]');
        if (!element) return;

        element.focus();
        if(element.select) element.select();
        
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        let nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        let setter = element.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter;

        // Если нам нужно оставить ячейку ПУСТОЙ
        if (value === "") {
            debug(`   -> [Очистка] Стираем старое значение и жмем Escape`);
            dispatchKey(element, 'Backspace', 8);
            if (setter) setter.call(element, "");
            else element.value = "";
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(50, "Очистка поля");
            element.dispatchEvent(new Event('change', { bubbles: true }));
            // ЖМЕМ ESCAPE вместо Enter, чтобы закрыть меню и ничего не выбрать!
            dispatchKey(element, 'Escape', 27); 
        } 
        // Если нам нужно ввести ТЕКСТ
        else {
            dispatchKey(element, 'Backspace', 8);
            if (setter) setter.call(element, "");
            else element.value = "";
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(50, "Очистка перед вводом");
            
            let currentStr = "";
            for (let char of value) {
                currentStr += char;
                if (setter) setter.call(element, currentStr);
                else element.value = currentStr;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(15, "Печать символа"); 
            }
            
            await sleep(100, "Обработка текста (React)"); 
            
            cell = getFreshCell(sIdx, rIdx, cIdx);
            if (cell) {
                let el = cell.querySelector('textarea') || cell.querySelector('input[type="text"]');
                if (el) {
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    dispatchKey(el, 'Enter', 13);
                }
            }
        }
        
        forceBlur(); 
        await sleep(100, "Сброс после ввода"); 
    }

    async function addPersonLikeHuman(sIdx, rIdx, cIdx, userName) {
        debug(`   -> [Действие] Добавляем элемент: "${userName}"`);
        let cell = getFreshCell(sIdx, rIdx, cIdx);
        if (!cell) return;
        let input = cell.querySelector('.wePersonCell__input') || cell.querySelector('input[type="text"]');
        
        if (!input) {
            gentleClick(cell, `Пустая ячейка`);
            await sleep(200, "Ожидание активации");
            cell = getFreshCell(sIdx, rIdx, cIdx);
            if (!cell) return;
            dispatchKey(cell, 'Enter', 13);
            await sleep(300, "Ожидание инпута"); 
            cell = getFreshCell(sIdx, rIdx, cIdx);
            if (!cell) return;
            input = cell.querySelector('.wePersonCell__input') || cell.querySelector('input[type="text"]');
        }
        if (!input) { 
            debugErr(`   -> [Ошибка] Инпут так и не появился!`);
            missingUsersReport.add(userName); 
            return; 
        }
        
        input.focus();
        let searchName = userName.replace(/["'«»]/g, '').trim();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        
        let currentStr = "";
        for (let char of searchName) {
            currentStr += char;
            nativeSetter.call(input, currentStr);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(20, "Печать"); 
        }

        input.dispatchEvent(new Event('change', { bubbles: true }));
        dispatchKey(input, ' ', 32); 
        
        debug(`   -> [Поиск] Ждем ответ сервера Pyrus (ищем "${userName}" в меню)...`);
        let cleanTarget = searchName.toLowerCase();
        let targetItem = null;
        let attempts = 0;
        
        while (attempts < 33) { 
            await sleep(150, `Сканирование меню, попытка ${attempts + 1}`);
            let menuItems = document.querySelectorAll('.completionMenuItem');
            
            for (let item of menuItems) {
                let title = (item.getAttribute('title') || "").trim();
                let text = (item.querySelector('.completionMenuItem__name')?.innerText || "").trim();
                let lowerText = text.toLowerCase();
                let cleanTitle = title.replace(/["'«»]/g, '').toLowerCase().trim();
                let cleanItemText = lowerText.replace(/["'«»]/g, '').trim();

                if (lowerText.includes('нов') && lowerText.includes('рол')) continue;
                if (lowerText.includes('создать') && lowerText.includes('рол')) continue;

                if (cleanTitle === cleanTarget || cleanItemText === cleanTarget) { targetItem = item; break; }
                if (cleanTitle.includes(cleanTarget) || cleanItemText.includes(cleanTarget)) { if (!targetItem) targetItem = item; }
            }
            
            if (targetItem) {
                debug(`   -> [Поиск] Успех! Элемент загрузился.`);
                break;
            }
            attempts++;
        }

        if (targetItem) {
            simulateRealClick(targetItem, `Выбор: ${userName}`);
        } else {
            debugErr(`   -> [Ошибка] Элемент "${userName}" так и не появился за 5 сек!`);
            missingUsersReport.add(userName); 
            cell = getFreshCell(sIdx, rIdx, cIdx);
            if (cell) {
                let escInput = cell.querySelector('.wePersonCell__input') || cell.querySelector('input[type="text"]');
                if (escInput) dispatchKey(escInput, 'Escape', 27); 
            }
        }
        forceBlur(); 
        await sleep(300, "Закрытие меню"); 
    }

    function getFormId() {
        let match = window.location.href.match(/(?:wf|rg|id|form)[^\d]*(\d+)/i);
        return match ? match[1] : "default_form";
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "SAVE_BACKUP") {
            try {
                let steps = document.querySelectorAll('.weWorkflowStep');
                if (steps.length === 0) return sendResponse({ status: "ERROR" });

                let backupData = {
                    id: Date.now(),
                    name: request.backupName || "Без имени",
                    date: new Date().toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                    formId: getFormId(),
                    steps: []
                };

                steps.forEach((step, stepIndex) => {
                    let stepObj = { stepIndex: stepIndex, columns: [], rules: [] };
                    step.querySelectorAll('.weFieldCell .weFieldName__text').forEach(el => {
                        let text = (el.innerText || el.textContent).trim();
                        if (text) stepObj.columns.push(text);
                    });

                    step.querySelectorAll('.weRule').forEach((rule, ruleIndex) => {
                        let ruleObj = { ruleIndex: ruleIndex, cells: [] };
                        Array.from(rule.children).forEach((cell, i) => {
                            let cellData = { cellIndex: i, isPerson: false, value: "", users: [] };
                            if (cell.classList.contains('wePersonCell')) {
                                cellData.isPerson = true;
                                cell.querySelectorAll('.token__text').forEach(t => cellData.users.push((t.innerText || t.textContent).trim()));
                            } else {
                                let textarea = cell.querySelector('textarea');
                                let input = cell.querySelector('input[type="text"]');
                                if (textarea) cellData.value = textarea.value;
                                else if (input) cellData.value = input.value;
                            }
                            ruleObj.cells.push(cellData);
                        });
                        stepObj.rules.push(ruleObj);
                    });
                    backupData.steps.push(stepObj);
                });

                chrome.storage.local.get([STORAGE_KEY], function(result) {
                    let backups = result[STORAGE_KEY] || [];
                    backups.unshift(backupData);
                    chrome.storage.local.set({ [STORAGE_KEY]: backups }, () => {
                        sendResponse({ status: "OK" });
                    });
                });
            } catch (e) {
                sendResponse({ status: "ERROR" });
            }
            return true;
        }

        if (request.action === "RESTORE_BACKUP") {
            if (window.isPyrusProWorking) {
                alert("⏳ Робот уже работает! Подождите.");
                return true;
            }
            window.isPyrusProWorking = true;

            chrome.storage.local.get([STORAGE_KEY], async function(result) {
                let targetBackup = (result[STORAGE_KEY] || []).find(b => b.id === request.backupId);
                if (!targetBackup) { window.isPyrusProWorking = false; return; }

                debug("🚀 СТАРТ ВОССТАНОВЛЕНИЯ");
                missingUsersReport.clear(); 
                let t0 = performance.now();

                try {
                    let domSteps = document.querySelectorAll('.weWorkflowStep');
                    for (let sIdx = 0; sIdx < targetBackup.steps.length; sIdx++) {
                        debug(`\n================================`);
                        debug(`--- ОБРАБОТКА ЭТАПА ${sIdx} ---`);
                        debug(`================================`);
                        let savedStep = targetBackup.steps[sIdx];
                        let domStep = document.querySelectorAll('.weWorkflowStep')[sIdx];
                        
                        if (!domStep) continue;

                        let currentDomRules = domStep.querySelectorAll('.weRule');
                        if (currentDomRules.length === 0 && savedStep.rules.length > 0) {
                            debug(`[Анализ] Правил 0. Добавляем ЯКОРЬ.`);
                            let addBtn = findAddRuleButton(domStep);
                            if (addBtn) {
                                gentleClick(addBtn, "Создание Якоря");
                                await waitForRuleCount(sIdx, 0, false);
                                await sleep(500, "Остывание после якоря"); 
                            }
                        }

                        debug(`\n--- ФАЗА 1: СИНХРОНИЗАЦИЯ КОЛОНОК ---`);
                        let safetyCol = 0;
                        while (safetyCol++ < 50) {
                            domStep = document.querySelectorAll('.weWorkflowStep')[sIdx];
                            let actualCols = Array.from(domStep.querySelectorAll('.weFieldCell')).filter(c => c.querySelector('.weFieldName__text'));
                            let savedCols = savedStep.columns || [];
                            let needsChange = false;

                            for (let i = 0; i < Math.max(actualCols.length, savedCols.length); i++) {
                                let actualName = actualCols[i] ? actualCols[i].querySelector('.weFieldName__text').innerText.trim() : null;
                                let savedName = savedCols[i];

                                if (actualName && actualName !== savedName) {
                                    debug(`   -> [Колонки] Найдена лишняя: [${actualName}]. Удаляем.`);
                                    let removeBtn = actualCols[i].querySelector('.weFieldCell__removeButton');
                                    if (removeBtn) {
                                        gentleClick(removeBtn, `Крестик колонки`); 
                                        await handleConfirmModal(); 
                                        await sleep(800, "Ожидание перерисовки Pyrus"); 
                                        needsChange = true; break; 
                                    }
                                }

                                if (!actualName && savedName) {
                                    debug(`   -> [Колонки] Не хватает: [${savedName}]. Добавляем.`);
                                    let addCondBtn = domStep.querySelector('[data-test-id="addRuleCondition"]');
                                    if (addCondBtn) {
                                        gentleClick(addCondBtn, `Кнопка 'Добавить условие'`);
                                        await sleep(500, "Ожидание поля ввода");
                                        domStep = document.querySelectorAll('.weWorkflowStep')[sIdx];
                                        let input = domStep.querySelector('.weFieldCell__input');
                                        if (input) {
                                            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                                            nativeSetter.call(input, savedName);
                                            input.dispatchEvent(new Event('input', { bubbles: true }));
                                            await sleep(800, "Ожидание списка"); 

                                            let menuItems = document.querySelectorAll('.completionMenuItem.workflowColumnItem');
                                            let targetItem = null;
                                            for (let item of menuItems) {
                                                let text = (item.querySelector('.workflowColumnItem__text_title')?.innerText || "").trim();
                                                if (text === savedName) { targetItem = item; break; }
                                            }
                                            if (targetItem) {
                                                simulateRealClick(targetItem, "Пункт условия");
                                            } else {
                                                dispatchKey(input, 'Enter', 13);
                                            }
                                            await sleep(1000, "Ожидание загрузки колонки"); 
                                        }
                                        needsChange = true; break;
                                    }
                                }
                            }
                            if (!needsChange) {
                                debug(`   -> [Колонки] Все колонки на идеальных местах.`);
                                break;
                            }
                        }

                        debug(`\n--- ФАЗА 2: ПРОВЕРКА ПРАВИЛ И ЯЧЕЕК ---`);
                        let tSurgery = performance.now();
                        domStep = document.querySelectorAll('.weWorkflowStep')[sIdx];
                        let rulesNodeList = domStep.querySelectorAll('.weRule');
                        let currentRulesArray = Array.from(rulesNodeList);
                        let targetRuleCount = savedStep.rules.length;

                        debug(`   -> [Анализ] В браузере: ${currentRulesArray.length} правил. В бекапе: ${targetRuleCount} правил.`);

                        if (currentRulesArray.length > targetRuleCount) {
                            debug(`   -> [Действие] Удаляем лишний хвост.`);
                            for (let rIdx = currentRulesArray.length - 1; rIdx >= targetRuleCount; rIdx--) {
                                let ruleToDelete = currentRulesArray[rIdx];
                                if(!ruleToDelete) continue;
                                let trashSvg = ruleToDelete.querySelector('use[*|href="#commonIcons--trashThin"]');
                                if (trashSvg) {
                                    let trashBtn = trashSvg.closest('button') || trashSvg.closest('.IconButton') || trashSvg.parentNode;
                                    let currentCount = document.querySelectorAll('.weWorkflowStep')[sIdx].querySelectorAll('.weRule').length;
                                    gentleClick(trashBtn, `Корзина правила ${rIdx}`);
                                    await handleConfirmModal();
                                    await waitForRuleCount(sIdx, currentCount, true);
                                    await sleep(500, "Остывание");
                                }
                            }
                            rulesNodeList = document.querySelectorAll('.weWorkflowStep')[sIdx].querySelectorAll('.weRule');
                            currentRulesArray = Array.from(rulesNodeList);
                        }

                        for (let rIdx = currentRulesArray.length; rIdx < targetRuleCount; rIdx++) {
                            domStep = document.querySelectorAll('.weWorkflowStep')[sIdx];
                            let addBtn = findAddRuleButton(domStep);
                            if (addBtn) {
                                debug(`   -> [Действие] Создаем недостающее правило ${rIdx}.`);
                                let oldRulesCount = document.querySelectorAll('.weWorkflowStep')[sIdx].querySelectorAll('.weRule').length;
                                await sleep(200);
                                gentleClick(addBtn, `Кнопка 'Добавить правило'`);
                                await waitForRuleCount(sIdx, oldRulesCount, false);
                                await sleep(500, "Остывание");
                            }
                        }

                        for (let rIdx = 0; rIdx < targetRuleCount; rIdx++) {
                            let savedRule = savedStep.rules[rIdx];
                            if (!savedRule) continue; 
                            
                            debug(`   -> [Анализ] Проверяем Правило ${rIdx}...`);
                            
                            for (let cIdx = 0; cIdx < savedRule.cells.length; cIdx++) {
                                let savedCell = savedRule.cells[cIdx];
                                let cell = getFreshCell(sIdx, rIdx, cIdx);
                                if (!cell) continue;

                                if (savedCell.isPerson) {
                                    let tokenEls = Array.from(cell.querySelectorAll('.token'));
                                    let currentTokensText = tokenEls.map(t => {
                                        let textEl = t.querySelector('.token__text');
                                        return textEl ? (textEl.innerText || textEl.textContent).trim() : "";
                                    }).filter(Boolean);
                                    
                                    let isIdentical = savedCell.users.length === currentTokensText.length && savedCell.users.every(u => currentTokensText.includes(u));
                                    if (isIdentical) continue;

                                    debug(`      [!] Ячейка ${cIdx} (Участники). Найдено отличие.`);
                                    
                                    for (let text of currentTokensText) {
                                        if (!savedCell.users.includes(text)) {
                                            debug(`      -> Лишний элемент: "${text}". Начинаем удаление.`);
                                            cell = getFreshCell(sIdx, rIdx, cIdx);
                                            if (!cell) continue;
                                            
                                            let t = Array.from(cell.querySelectorAll('.token')).find(el => (el.querySelector('.token__text')?.innerText || "").trim() === text);
                                            if (t) {
                                                directClick(t, `Плашка токена "${text}"`);
                                                await sleep(300, "Ждем отрисовки крестика"); 
                                                
                                                cell = getFreshCell(sIdx, rIdx, cIdx); 
                                                if (!cell) continue;
                                                t = Array.from(cell.querySelectorAll('.token')).find(el => (el.querySelector('.token__text')?.innerText || "").trim() === text);
                                                
                                                if (t) {
                                                    let crossBtn = t.querySelector('.token__cross') || t.querySelector('button[aria-label^="Удалить"]');
                                                    if (crossBtn) {
                                                        directClick(crossBtn, `Крестик удаления`);
                                                    } else {
                                                        debug(`      -> Крестика нет, жмем Backspace.`);
                                                        if (t.focus) t.focus();
                                                        dispatchKey(t, 'Backspace', 8); 
                                                        dispatchKey(document.activeElement, 'Backspace', 8); 
                                                    }
                                                    forceBlur(); 
                                                    await sleep(500, "Ожидание после удаления"); 
                                                }
                                            }
                                        }
                                    }
                                    
                                    cell = getFreshCell(sIdx, rIdx, cIdx);
                                    if (!cell) continue;
                                    let newTokensText = Array.from(cell.querySelectorAll('.token__text')).map(t => t.innerText.trim());
                                    let usersToAdd = savedCell.users.filter(u => !newTokensText.includes(u));
                                    
                                    for (let userName of usersToAdd) {
                                        await addPersonLikeHuman(sIdx, rIdx, cIdx, userName);
                                        await sleep(500, "Перерыв между добавлениями"); 
                                    }
                                    
                                } else {
                                    let targetEl = cell.querySelector('textarea') || cell.querySelector('input[type="text"]');
                                    let val = targetEl ? targetEl.value : "";
                                    if (targetEl && val !== savedCell.value) {
                                        debug(`      [!] Ячейка ${cIdx} (Текст). Меняем "${val}" на "${savedCell.value}"`);
                                        await typeLikeHuman(sIdx, rIdx, cIdx, savedCell.value);
                                    }
                                }
                            }
                        }
                        let tSurgeryEnd = performance.now();
                        debug(`Микрохирургия этапа ${sIdx} завершена за ${(tSurgeryEnd - tSurgery).toFixed(2)} мс.`);
                    }
                    
                    window.isPyrusProWorking = false; 
                    let tTotal = performance.now();
                    debug(`Общее время работы: ${((tTotal - t0) / 1000).toFixed(2)} сек.`);

                    if (missingUsersReport.size > 0) {
                        let missingList = Array.from(missingUsersReport).map(u => `- ${u}`).join('\n');
                        alert(`✅ Восстановление завершено!\n\n⚠️ Не удалось найти:\n${missingList}`);
                    } else {
                        alert("✅ PRO: Восстановление завершено идеально!");
                    }
                } catch (err) {
                    window.isPyrusProWorking = false;
                    debugErr(`Фатальная ошибка скрипта:`, err);
                    alert("PRO Ошибка: " + err.message);
                }
            });
            return true;
        }
    });
})();