// 1. ВЕКТОРНЫЙ ЛОГОТИП (Base64 SVG)
const proLogoSvgURI = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='24' fill='%230052cc'/%3E%3Ctext x='64' y='72' fill='white' font-family='sans-serif' font-weight='bold' font-size='44' text-anchor='middle' dominant-baseline='middle'%3EPRO%3C/text%3E%3C/svg%3E";

// 2. СТИЛИ ДЛЯ ПОДСВЕТКИ
if (!document.getElementById('pro-highlight-style')) {
    let style = document.createElement('style');
    style.id = 'pro-highlight-style';
    style.innerHTML = `
        @keyframes proHighlightAnim {
            0%   { background-color: rgba(255, 193, 7, 0); box-shadow: 0 0 0px rgba(255, 193, 7, 0); }
            15%  { background-color: rgba(255, 193, 7, 0); box-shadow: 0 0 0px rgba(255, 193, 7, 0); }
            20%  { background-color: rgba(255, 193, 7, 0.9); box-shadow: 0 0 8px rgba(255, 193, 7, 0.6); }
            50%  { background-color: rgba(255, 193, 7, 0.9); box-shadow: 0 0 8px rgba(255, 193, 7, 0.6); }
            100% { background-color: rgba(255, 193, 7, 0); box-shadow: 0 0 0px rgba(255, 193, 7, 0); }
        }
        .pro-highlighted { animation: proHighlightAnim 3s ease-out forwards !important; border-radius: 4px; }
    `;
    document.head.appendChild(style);
}

// 3. ПРИЕМНИК СИГНАЛОВ
if (!window._pyrusHighlightAdded) {
    function applyHighlight(el, scrollOptions) {
        el.scrollIntoView(scrollOptions);
        setTimeout(() => el.scrollIntoView(scrollOptions), 300); 
        el.classList.remove('pro-highlighted');
        void el.offsetWidth; 
        el.classList.add('pro-highlighted');
    }

    window.addEventListener('message', function(e) {
        let steps = document.querySelectorAll('.weWorkflowStep');
        if (!e.data || !steps[e.data.stepIndex]) return;

        if (e.data.action === 'highlightRule' || e.data.action === 'highlightStage' || e.data.action === 'highlightCondition') {
            try { chrome.runtime.sendMessage({ action: "focusTab" }); } catch(err) {}

            if (e.data.action === 'highlightRule') {
                let rule = steps[e.data.stepIndex].querySelectorAll('.weRule')[e.data.ruleIndex];
                if (rule) applyHighlight(rule, {behavior: 'smooth', block: 'center'});
            } 
            else if (e.data.action === 'highlightStage') {
                let step = steps[e.data.stepIndex];
                let header = step.querySelector('.weStepsHeader') || step;
                applyHighlight(header, {behavior: 'smooth', block: 'start'});
            } 
            else if (e.data.action === 'highlightCondition') {
                let rule = steps[e.data.stepIndex].querySelectorAll('.weRule')[e.data.ruleIndex];
                if (rule && rule.children[e.data.cellIndex]) {
                    applyHighlight(rule.children[e.data.cellIndex], {behavior: 'smooth', block: 'center', inline: 'center'});
                }
            }
        }
    });
    window._pyrusHighlightAdded = true;
}

// 4. CSS ДЛЯ НОВОЙ ВКЛАДКИ
const proThemeCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
    :root { --bg-main: #f4f5f7; --text-main: #172b4d; --bg-table: #ffffff; --border: #dfe1e6; --bg-header: #fafbfc; --text-header: #5e6c84; --bg-stage: #e9eff7; --text-stage: #0052cc; --bg-cond-key: #ebecf0; --text-cond-key: #5e6c84; --bg-badge: #e2eafc; --text-badge: #0052cc; --shadow: rgba(9,30,66,0.15); --highlight: #0052cc; }
    [data-theme="dark"] { --bg-main: #121212; --text-main: #e0e0e0; --bg-table: #1e1e1e; --border: #333333; --bg-header: #2a2a2a; --text-header: #b0b0b0; --bg-stage: #2c3e50; --text-stage: #66b3ff; --bg-cond-key: #2d2d2d; --text-cond-key: #aaaaaa; --bg-badge: #1a365d; --text-badge: #90cdf4; --shadow: rgba(0,0,0,0.5); --highlight: #66b3ff; }
    
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px 2%; background-color: var(--bg-main); color: var(--text-main); transition: 0.3s; }
    .pro-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid var(--border); padding-bottom: 10px; position: sticky; top: 0; background: var(--bg-main); z-index: 9999; }
    .pro-top-bar h1 { font-size: 18px; margin: 0; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
    .pro-top-buttons { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .pro-action-btn { background: var(--bg-stage); color: var(--text-stage); border: 1px solid var(--border); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; transition: 0.2s; }
    .pro-action-btn:hover { filter: brightness(0.9); }
    .pro-share-btn { background: #0052cc; color: #fff; border-color: #0052cc; }
    [data-theme="dark"] .pro-share-btn { background: #66b3ff; color: #121212; }
    
    .dropdown-container { position: relative; display: inline-block; }
    .dropdown-menu { display: none; position: absolute; top: 100%; right: 0; background: var(--bg-table); border: 1px solid var(--border); box-shadow: 0 4px 12px var(--shadow); border-radius: 4px; z-index: 200; min-width: 200px; overflow: hidden; margin-top: 4px; }
    .dropdown-menu.show { display: block; }
    .dropdown-item { padding: 10px 12px; cursor: pointer; color: var(--text-main); font-size: 12px; border-bottom: 1px solid var(--border); transition: 0.2s; }
    .dropdown-item:hover { background: var(--bg-header); }

    .stage-container { margin-bottom: 20px; position: relative; scroll-margin-top: 60px; }
    .stage-title { position: sticky; top: 45px; margin-top: 10px; font-size: 13px; font-weight: bold; background: var(--bg-stage); padding: 6px 10px; border: 1px solid var(--border); border-bottom: none; box-shadow: 0 2px 4px var(--shadow); display: flex; justify-content: space-between; align-items: center; border-radius: 4px 4px 0 0; z-index: 1000; }
    .stage-title-left { display: flex; align-items: center; gap: 8px; }
    .rule-link { color: var(--highlight); text-decoration: none; border-bottom: 1px dashed var(--highlight); cursor: pointer; padding: 2px; transition: 0.2s; }
    .rule-link:hover { opacity: 0.7; background: rgba(0, 82, 204, 0.1); border-radius: 3px; }
    .stage-link { font-size: 13px; font-weight: bold; color: var(--text-stage); border-bottom: 1px dashed var(--text-stage); text-decoration: none; cursor: pointer; }
    .stage-link:hover { opacity: 0.8; }
    .collapse-btn { cursor: pointer; background: rgba(0,0,0,0.05); border-radius: 4px; padding: 2px 6px; font-size: 10px; transition: 0.2s; user-select: none; width: 14px; text-align: center; color: var(--text-main); }
    .collapse-btn:hover { background: rgba(0,0,0,0.1); }
    .collapsed .table-responsive, .collapsed .filters-wrapper { display: none; }
    
    .filters-wrapper { display: flex; gap: 8px; align-items: center; font-weight: normal; }
    .stage-nav { display: flex; gap: 4px; margin-right: 4px; }
    .stage-nav-btn { background: var(--bg-table); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; padding: 3px 8px; font-size: 12px; transition: 0.2s; display: flex; align-items: center; justify-content: center; user-select: none; }
    .stage-nav-btn:hover:not(:disabled) { background: var(--bg-header); transform: translateY(-1px); }
    .stage-nav-btn:active:not(:disabled) { transform: translateY(0); }
    .stage-nav-btn:disabled { opacity: 0.4; cursor: default; }

    .filter-details { position: relative; }
    .filter-summary { background: var(--bg-table); color: var(--text-main); padding: 4px 10px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; font-size: 11px; user-select: none; transition: 0.2s; list-style: none; display: flex; align-items: center; gap: 4px; }
    .filter-summary::-webkit-details-marker { display: none; }
    .filter-summary:hover { opacity: 0.8; }
    .filter-active { background: var(--bg-badge); color: var(--text-badge); border-color: var(--text-badge); font-weight: bold; }
    .filter-content { position: absolute; top: calc(100% + 5px); right: 0; background: var(--bg-table); border: 1px solid var(--border); box-shadow: 0 4px 12px var(--shadow); max-height: 300px; overflow-y: auto; min-width: 250px; max-width: 400px; padding: 6px; border-radius: 6px; }
    .filter-search { width: 100%; box-sizing: border-box; padding: 5px 8px; margin-bottom: 6px; font-size: 11px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-main); color: var(--text-main); outline: none; }
    .filter-content label { display: flex; align-items: flex-start; gap: 6px; padding: 5px; font-size: 11px; cursor: pointer; color: var(--text-main); border-radius: 3px; border-bottom: 1px solid transparent; }
    .filter-content label:hover { background: var(--bg-header); }
    
    .table-responsive { width: 100%; overflow-x: auto; box-sizing: border-box; border-radius: 0 0 4px 4px; box-shadow: 0 1px 3px var(--shadow); background: var(--bg-table); border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
    .rules-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .rules-table th { background: var(--bg-header); border-bottom: 2px solid var(--border); padding: 6px; text-align: left; color: var(--text-header); font-size: 10px; text-transform: uppercase; }
    .rules-table td { border-bottom: 1px solid var(--border); padding: 6px; vertical-align: middle; color: var(--text-main); }
    .rules-table tr:hover td { background-color: var(--bg-header); }
    .col-num { width: 35px; text-align: center !important; vertical-align: middle !important; font-weight: bold; color: var(--text-header); border-right: 1px solid var(--border); }
    .col-users { width: 180px; border-right: 1px solid var(--border); }
    .cond-item { display: inline-flex; border: 1px solid var(--border); border-radius: 4px; margin: 2px 4px 2px 0; overflow: hidden; background: var(--bg-table); align-items: stretch; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; transform: translateZ(0); will-change: transform, box-shadow; }
    .cond-item:hover { transform: translateY(-1px) translateZ(0); box-shadow: 0 2px 5px var(--shadow); filter: brightness(0.95); }
    .cond-item:active { transform: translateY(0) translateZ(0); }
    .cond-name { background-color: var(--bg-cond-key); color: var(--text-cond-key); padding: 3px 6px; font-size: 9px; font-weight: bold; border-right: 1px solid var(--border); display: flex; align-items: center; }
    .cond-val { padding: 3px 6px; font-size: 10px; font-weight: 500; color: var(--text-main); display: flex; align-items: center; word-break: break-word; }
    .user-badge { display: inline-block; background: var(--bg-badge); color: var(--text-badge); padding: 2px 5px; border-radius: 3px; margin: 1px 0; font-size: 10px; font-weight: 600; }
    .empty-cond { color: var(--text-header); font-style: italic; font-size: 10px; }
    
    .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding: 20px 0; border-top: 1px solid var(--border); color: var(--text-header); font-size: 12px; }
    .author-link { display: flex; align-items: center; gap: 8px; color: var(--text-main); text-decoration: none; transition: 0.2s; }
    .author-name { font-family: 'Caveat', cursive; font-size: 20px; font-weight: 700; letter-spacing: 1px; color: var(--text-main); transition: 0.2s; }
    .author-link:hover .author-name { color: var(--text-stage); }
    .author-for { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: normal; color: var(--text-header); margin-left: 2px; }
    .version-text { font-family: monospace; color: var(--text-header); }
`;

// 5. КОД ДЛЯ СКАЧАННОГО ФАЙЛА HTML (Работает без расширения)
const standaloneJSLogic = `
    function triggerHighlight(action, s, r, c) {
        if (window.opener && !window.opener.closed) {
            try { window.opener.focus(); } catch(e) {}
            window.opener.postMessage({action: action, stepIndex: s, ruleIndex: r, cellIndex: c}, '*');
        } else {
            alert('Оригинальная вкладка Pyrus закрыта! Чтобы перейти к правилу, не закрывайте исходную страницу.');
        }
    }

    document.addEventListener('click', function(e) {
        let navBtn = e.target.closest('.stage-nav-btn'); if (navBtn && !navBtn.disabled) { e.preventDefault(); let tgt = document.getElementById('pro-stage-' + navBtn.dataset.target); if(tgt) tgt.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
        
        let cItem = e.target.closest('.cond-item'); if (cItem) { e.preventDefault(); triggerHighlight('highlightCondition', cItem.dataset.step, cItem.dataset.rule, cItem.dataset.cell); return; }
        let rLink = e.target.closest('.rule-link'); if (rLink) { e.preventDefault(); triggerHighlight('highlightRule', rLink.dataset.step, rLink.dataset.rule); return; }
        let sLink = e.target.closest('.stage-link'); if (sLink) { e.preventDefault(); triggerHighlight('highlightStage', sLink.dataset.step); return; }
        
        if (e.target.closest('#pro-theme-btn')) { let h = document.documentElement; if (h.getAttribute('data-theme') === 'dark') { h.removeAttribute('data-theme'); localStorage.setItem('pyrus_pro_theme', 'light'); } else { h.setAttribute('data-theme', 'dark'); localStorage.setItem('pyrus_pro_theme', 'dark'); } }
        else if (e.target.closest('#pro-collapse-all-btn')) {
            let btn = e.target.closest('#pro-collapse-all-btn'); let isCol = btn.dataset.collapsed === 'true';
            document.querySelectorAll('.stage-container').forEach(c => { if(isCol) { c.classList.remove('collapsed'); c.querySelector('.collapse-btn').innerText = '▼'; } else { c.classList.add('collapsed'); c.querySelector('.collapse-btn').innerText = '▶'; } });
            btn.dataset.collapsed = !isCol; btn.innerText = !isCol ? '▶ Развернуть всё' : '🔽 Свернуть всё';
        }
        else if (e.target.closest('.collapse-btn')) { let c = e.target.closest('.stage-container'); c.classList.toggle('collapsed'); e.target.closest('.collapse-btn').innerText = c.classList.contains('collapsed') ? '▶' : '▼'; }
        
        if (e.target.closest('#pro-excel-btn')) {
            let menu = document.getElementById('pro-excel-menu');
            let hasFilters = document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
            let filteredItem = document.getElementById('export-excel-filtered');
            if (!hasFilters) { filteredItem.style.opacity = '0.5'; filteredItem.style.pointerEvents = 'none'; filteredItem.title = 'Сначала примените фильтры'; } else { filteredItem.style.opacity = '1'; filteredItem.style.pointerEvents = 'auto'; filteredItem.title = ''; }
            menu.classList.toggle('show'); return;
        }
        if (e.target.closest('#export-excel-all') || e.target.closest('#export-excel-filtered')) {
            let isFiltered = e.target.closest('#export-excel-filtered') !== null;
            document.getElementById('pro-excel-menu').classList.remove('show');
            let csv = String.fromCharCode(0xFEFF) + "Этап;Номер правила;Участники;Условия\\n";
            document.querySelectorAll('.stage-container').forEach(stage => {
                let stageName = stage.querySelector('.stage-link').innerText;
                stage.querySelectorAll('.rules-table tbody tr').forEach(row => {
                    if (isFiltered && row.style.display === 'none') return;
                    let ruleNum = row.querySelector('.rule-link').innerText;
                    let users = Array.from(row.querySelectorAll('.user-badge')).map(u => u.innerText).join(', ');
                    let conds = []; row.querySelectorAll('.cond-item').forEach(c => { conds.push(c.querySelector('.cond-name').innerText + ": " + c.querySelector('.cond-val').innerText); });
                    let condStr = conds.length > 0 ? conds.join(' | ') : 'Нет условий';
                    csv += '"' + stageName.replace(/"/g, '""') + '";"' + ruleNum + '";"' + users.replace(/"/g, '""') + '";"' + condStr.replace(/"/g, '""') + '"\\n';
                });
            });
            let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            let link = document.createElement("a"); link.href = URL.createObjectURL(blob);
            link.download = isFiltered ? "PRO_Отфильтровано.csv" : "PRO_Полная.csv"; link.click(); return;
        }

        if (!e.target.closest('.dropdown-container')) { let menu = document.getElementById('pro-excel-menu'); if (menu) menu.classList.remove('show'); }
        document.querySelectorAll('.filter-details').forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); });
    });

    document.addEventListener('input', function(e) { if (e.target.classList.contains('filter-search')) { let term = e.target.value.toLowerCase(); e.target.parentElement.querySelectorAll('label').forEach(lbl => { lbl.style.display = lbl.textContent.toLowerCase().includes(term) ? '' : 'none'; }); } });
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            let c = e.target.closest('.stage-container'); if(!c) return;
            let rows = c.querySelectorAll('.rules-table tbody tr');
            let u = Array.from(c.querySelectorAll('.flt-u:checked')).map(i=>i.value), f = Array.from(c.querySelectorAll('.flt-f:checked')).map(i=>i.value);
            let uSum = c.querySelector('.user-filter-box .filter-summary'); if(u.length>0){ uSum.classList.add('filter-active'); uSum.innerText='👥 Участники ('+u.length+')'; } else { uSum.classList.remove('filter-active'); uSum.innerText='👥 Участники ▼'; }
            let fSum = c.querySelector('.field-filter-box .filter-summary'); if(f.length>0){ fSum.classList.add('filter-active'); fSum.innerText='⚙️ Поля ('+f.length+')'; } else { fSum.classList.remove('filter-active'); fSum.innerText='⚙️ Поля ▼'; }
            rows.forEach(row => {
                let ru = row.getAttribute('data-users').split('|||'), rf = row.getAttribute('data-fields').split('|||');
                row.style.display = ((u.length===0 || u.some(x=>ru.includes(x))) && (f.length===0 || f.some(x=>rf.includes(x)))) ? '' : 'none';
            });
        }
    });
    document.addEventListener('toggle', function(e) { if (e.target.classList.contains('filter-details') && e.target.open) { let s = e.target.querySelector('.filter-search'); if(s) setTimeout(()=>s.focus(), 50); } }, true);
`;

// 6. ОЖИВЛЯЕМ НОВУЮ ВКЛАДКУ (Связь с материнской страницей)
let proRoutingWindow = null; 

function attachProEvents(doc, formUrl, originalWin) {
    
    // АВТО-ЗАКРЫТИЕ Вкладки PRO, если закрыли оригинальный Pyrus
    let autoCloseTimer = doc.defaultView.setInterval(function() {
        if (!originalWin || originalWin.closed) {
            doc.defaultView.close();
        }
    }, 1000);

    function triggerHighlight(action, s, r, c) {
        if (originalWin && !originalWin.closed) {
            try { originalWin.focus(); } catch(e) {}
            originalWin.postMessage({action: action, stepIndex: s, ruleIndex: r, cellIndex: c}, '*');
        } else {
            alert('Оригинальная вкладка Pyrus закрыта! Чтобы перейти к правилу, не закрывайте исходную страницу.');
        }
    }

    doc.addEventListener('click', function(e) {
        let navBtn = e.target.closest('.stage-nav-btn'); if (navBtn && !navBtn.disabled) { e.preventDefault(); let tgt = doc.getElementById('pro-stage-' + navBtn.dataset.target); if(tgt) tgt.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
        
        let cItem = e.target.closest('.cond-item'); if (cItem) { e.preventDefault(); triggerHighlight('highlightCondition', cItem.dataset.step, cItem.dataset.rule, cItem.dataset.cell); return; }
        let rLink = e.target.closest('.rule-link'); if (rLink) { e.preventDefault(); triggerHighlight('highlightRule', rLink.dataset.step, rLink.dataset.rule); return; }
        let sLink = e.target.closest('.stage-link'); if (sLink) { e.preventDefault(); triggerHighlight('highlightStage', sLink.dataset.step); return; }
        
        if (e.target.closest('#pro-theme-btn')) { let h = doc.documentElement; if (h.getAttribute('data-theme') === 'dark') { h.removeAttribute('data-theme'); originalWin.localStorage.setItem('pyrus_pro_theme', 'light'); } else { h.setAttribute('data-theme', 'dark'); originalWin.localStorage.setItem('pyrus_pro_theme', 'dark'); } }
        else if (e.target.closest('#pro-collapse-all-btn')) {
            let btn = e.target.closest('#pro-collapse-all-btn'); let isCol = btn.dataset.collapsed === 'true';
            doc.querySelectorAll('.stage-container').forEach(c => { if(isCol) { c.classList.remove('collapsed'); c.querySelector('.collapse-btn').innerText = '▼'; } else { c.classList.add('collapsed'); c.querySelector('.collapse-btn').innerText = '▶'; } });
            btn.dataset.collapsed = !isCol; btn.innerText = !isCol ? '▶ Развернуть всё' : '🔽 Свернуть всё';
        }
        else if (e.target.closest('.collapse-btn')) { let c = e.target.closest('.stage-container'); c.classList.toggle('collapsed'); e.target.closest('.collapse-btn').innerText = c.classList.contains('collapsed') ? '▶' : '▼'; }
        
        if (e.target.closest('#pro-excel-btn')) {
            let menu = doc.getElementById('pro-excel-menu');
            let hasFilters = doc.querySelectorAll('input[type="checkbox"]:checked').length > 0;
            let filteredItem = doc.getElementById('export-excel-filtered');
            if (!hasFilters) { filteredItem.style.opacity = '0.5'; filteredItem.style.pointerEvents = 'none'; filteredItem.title = 'Сначала примените фильтры'; } else { filteredItem.style.opacity = '1'; filteredItem.style.pointerEvents = 'auto'; filteredItem.title = ''; }
            menu.classList.toggle('show'); return;
        }
        if (e.target.closest('#export-excel-all') || e.target.closest('#export-excel-filtered')) {
            let isFiltered = e.target.closest('#export-excel-filtered') !== null;
            doc.getElementById('pro-excel-menu').classList.remove('show');
            let csv = String.fromCharCode(0xFEFF) + "Этап;Номер правила;Участники;Условия\n";
            doc.querySelectorAll('.stage-container').forEach(stage => {
                let stageName = stage.querySelector('.stage-link').innerText;
                stage.querySelectorAll('.rules-table tbody tr').forEach(row => {
                    if (isFiltered && row.style.display === 'none') return;
                    let ruleNum = row.querySelector('.rule-link').innerText;
                    let users = Array.from(row.querySelectorAll('.user-badge')).map(u => u.innerText).join(', ');
                    let conds = []; row.querySelectorAll('.cond-item').forEach(c => { conds.push(c.querySelector('.cond-name').innerText + ": " + c.querySelector('.cond-val').innerText); });
                    let condStr = conds.length > 0 ? conds.join(' | ') : 'Нет условий';
                    csv += '"' + stageName.replace(/"/g, '""') + '";"' + ruleNum + '";"' + users.replace(/"/g, '""') + '";"' + condStr.replace(/"/g, '""') + '"\n';
                });
            });
            let formTitle = doc.title.replace('PRO: ', '').trim() || 'Форма';
            let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            let link = doc.createElement("a"); link.href = URL.createObjectURL(blob);
            link.download = isFiltered ? `PRO_Отфильтровано_${formTitle}.csv` : `PRO_Полная_${formTitle}.csv`; link.click(); return;
        }

        if (e.target.closest('#pro-share-btn')) {
            let formTitle = doc.title.replace('PRO: ', '').trim() || 'Форма';
            doc.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (cb.checked) cb.setAttribute('checked', 'checked'); else cb.removeAttribute('checked'); });
            doc.querySelectorAll('.filter-search').forEach(inp => { inp.setAttribute('value', inp.value); });
            let standaloneScript = `<script>let formUrl = "${formUrl}";\n${standaloneJSLogic}<\/script>`;
            let currentHtml = "<!DOCTYPE html><html" + (doc.documentElement.getAttribute('data-theme') ? ' data-theme="dark"' : '') + ">" + doc.documentElement.innerHTML + standaloneScript + "</html>";
            let blob = new Blob([currentHtml], {type: "text/html;charset=utf-8"});
            let link = doc.createElement("a"); link.href = URL.createObjectURL(blob);
            link.download = `PRO_Маршрутизация_${formTitle}.html`; link.click(); return;
        }

        if (!e.target.closest('.dropdown-container')) { let menu = doc.getElementById('pro-excel-menu'); if (menu) menu.classList.remove('show'); }
        doc.querySelectorAll('.filter-details').forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); });
    });

    doc.addEventListener('input', function(e) { if (e.target.classList.contains('filter-search')) { let term = e.target.value.toLowerCase(); e.target.parentElement.querySelectorAll('label').forEach(lbl => { lbl.style.display = lbl.textContent.toLowerCase().includes(term) ? '' : 'none'; }); } });
    doc.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            let c = e.target.closest('.stage-container'); if(!c) return;
            let rows = c.querySelectorAll('.rules-table tbody tr');
            let u = Array.from(c.querySelectorAll('.flt-u:checked')).map(i=>i.value), f = Array.from(c.querySelectorAll('.flt-f:checked')).map(i=>i.value);
            let uSum = c.querySelector('.user-filter-box .filter-summary'); if(u.length>0){ uSum.classList.add('filter-active'); uSum.innerText='👥 Участники ('+u.length+')'; } else { uSum.classList.remove('filter-active'); uSum.innerText='👥 Участники ▼'; }
            let fSum = c.querySelector('.field-filter-box .filter-summary'); if(f.length>0){ fSum.classList.add('filter-active'); fSum.innerText='⚙️ Поля ('+f.length+')'; } else { fSum.classList.remove('filter-active'); fSum.innerText='⚙️ Поля ▼'; }
            rows.forEach(row => {
                let ru = row.getAttribute('data-users').split('|||'), rf = row.getAttribute('data-fields').split('|||');
                row.style.display = ((u.length===0 || u.some(x=>ru.includes(x))) && (f.length===0 || f.some(x=>rf.includes(x)))) ? '' : 'none';
            });
        }
    });
    doc.addEventListener('toggle', function(e) { if (e.target.classList.contains('filter-details') && e.target.open) { let s = e.target.querySelector('.filter-search'); if(s) setTimeout(()=>s.focus(), 50); } }, true);
}

// 7. ГЕНЕРАТОР: Асинхронно собирает HTML
let isBuildingPro = false;

window.addEventListener('beforeunload', () => {
    if (proRoutingWindow && !proRoutingWindow.closed) {
        proRoutingWindow.close();
    }
});

async function expandProRouting(event) {
    if (isBuildingPro) return;

    if (proRoutingWindow && !proRoutingWindow.closed) {
        try { proRoutingWindow.focus(); return; } catch(e) {}
    }

    let steps = document.querySelectorAll('.weWorkflowStep');
    if (steps.length === 0) return;

    isBuildingPro = true;
    let btn = event.currentTarget;
    let originalHtml = btn.innerHTML;

    try {
        let formTitle = document.title.replace(' - Pyrus', '').trim() || 'Маршрутизация';
        let savedTheme = window.localStorage.getItem('pyrus_pro_theme') || 'light';
        let themeAttr = savedTheme === 'dark' ? ' data-theme="dark"' : '';

        let htmlChunks = [];
        htmlChunks.push(`<!DOCTYPE html><html${themeAttr}><head><meta charset="utf-8">`);
        htmlChunks.push(`<title>PRO: ${formTitle}</title>`);
        htmlChunks.push(`<link rel="icon" href="${proLogoSvgURI}" type="image/svg+xml">`);
        htmlChunks.push(`<style>${proThemeCSS}</style></head><body>`);
        
        htmlChunks.push(`<div class="pro-top-bar">
            <h1 style="display:flex; align-items:center; gap:8px;">
                <img src="${proLogoSvgURI}" style="width:24px; height:24px; border-radius:4px;" alt="PRO">
                ${formTitle}
            </h1>
            <div class="pro-top-buttons">
                <button class="pro-action-btn" id="pro-collapse-all-btn" data-collapsed="false">🔽 Свернуть всё</button>
                <button class="pro-action-btn share-btn" id="pro-share-btn">📤 Поделиться HTML</button>
                <div class="dropdown-container">
                    <button class="pro-action-btn" id="pro-excel-btn" style="background: #217346; color: white; border-color: #217346;">📊 В Excel ▼</button>
                    <div class="dropdown-menu" id="pro-excel-menu">
                        <div class="dropdown-item" id="export-excel-all">Всю маршрутизацию</div>
                        <div class="dropdown-item" id="export-excel-filtered">Только отфильтрованную</div>
                    </div>
                </div>
                <button class="pro-action-btn" id="pro-theme-btn">🌗 Тема</button>
            </div>
        </div>`);

        function esc(str) { return str ? str.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : ""; }

        let totalRules = 0;
        for (let i = 0; i < steps.length; i++) {
            let rs = steps[i].getElementsByClassName('weRule');
            if (rs) totalRules += rs.length;
        }
        let processedRules = 0;
        let lastYieldTime = Date.now();

        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
            let step = steps[stepIndex];
            if (!step) continue;
            
            let nameInput = step.querySelector('.weStepsHeader__input');
            let rawName = (nameInput && nameInput.value) ? nameInput.value : "Без названия";
            let stepName = (stepIndex === 0) ? "Наблюдатели" : `Этап ${stepIndex}: ${rawName}`;

            let stepHeaders = [];
            let headerRow = step.querySelector('.weTableHeader tr.weWorkflowStep__row');
            if (headerRow) {
                Array.from(headerRow.children).forEach(cell => {
                    let textEl = cell.querySelector('.weFieldName__text');
                    if (textEl && !cell.classList.contains('wePersonCell')) stepHeaders.push(textEl.textContent.replace(/\n/g, '').trim());
                    else if (cell.classList.contains('wePersonCell')) stepHeaders.push("PERSON_CELL");
                    else stepHeaders.push("");
                });
            }

            let rules = step.getElementsByClassName('weRule');
            let rulesCount = rules.length;
            if (rulesCount === 0) continue;

            let stageUsers = new Set(), stageFields = new Set(), rowsHTMLChunks = [];

            for (let ruleIndex = 0; ruleIndex < rulesCount; ruleIndex++) {
                
                if (Date.now() - lastYieldTime > 30) {
                    let percent = totalRules > 0 ? Math.floor((processedRules / totalRules) * 100) : 0;
                    btn.innerHTML = `⏳ <span>Сборка... ${percent}%</span>`;
                    await new Promise(resolve => setTimeout(resolve, 0)); 
                    lastYieldTime = Date.now();
                }
                processedRules++;

                try {
                    let ruleNum = ruleIndex + 1, cells = rules[ruleIndex].children;
                    if (!cells) continue;
                    
                    let personsHTML = [], conditionsHTML = [], ruleUsersClean = [], ruleFieldsClean = [];
                    
                    for (let i = 0; i < cells.length; i++) {
                        try {
                            let cell = cells[i];
                            if (!cell || !cell.classList) continue; 
                            
                            let headerName = stepHeaders[i] || "Неизвестно";
                            
                            if (cell.classList.contains('wePersonCell')) {
                                let tokens = cell.getElementsByClassName('token__text');
                                for(let t=0; t<tokens.length; t++) { 
                                    if(tokens[t]) {
                                        let uName = tokens[t].textContent.trim(); 
                                        stageUsers.add(uName); ruleUsersClean.push(uName); personsHTML.push(`<span class="user-badge">${uName}</span>`); 
                                    }
                                }
                            } else if (headerName !== "PERSON_CELL") {
                                let val = "";
                                let textAreas = cell.getElementsByTagName('textarea');
                                if (textAreas.length > 0 && textAreas[0] && textAreas[0].value) {
                                    val = textAreas[0].value.trim().replace(/\n/g, ', '); 
                                } else {
                                    let textInputs = cell.getElementsByTagName('input');
                                    if (textInputs.length > 0 && textInputs[0] && textInputs[0].type === 'text' && textInputs[0].value) {
                                        val = textInputs[0].value.trim();
                                    }
                                }
                                
                                if (val) { 
                                    stageFields.add(headerName); ruleFieldsClean.push(headerName); 
                                    conditionsHTML.push(`<div class="cond-item" data-step="${stepIndex}" data-rule="${ruleIndex}" data-cell="${i}" title="Показать в Pyrus"><div class="cond-name">${headerName}</div><div class="cond-val">${val}</div></div>`); 
                                }
                            }
                        } catch(cellErr) {} 
                    }
                    
                    let condStr = conditionsHTML.length > 0 ? conditionsHTML.join(' ') : `<span class="empty-cond">Нет условий</span>`;
                    let ruleLinkHTML = `<a class="rule-link" data-step="${stepIndex}" data-rule="${ruleIndex}" title="Показать правило в Pyrus">${ruleNum}</a>`;
                    rowsHTMLChunks.push(`<tr data-users="${esc(ruleUsersClean.join('|||'))}" data-fields="${esc(ruleFieldsClean.join('|||'))}"><td class="col-num">${ruleLinkHTML}</td><td class="col-users">${personsHTML.join('<br>')}</td><td>${condStr}</td></tr>`);
                } catch(ruleErr) {} 
            }

            let navHtml = `<div class="stage-nav">`;
            navHtml += `<button class="stage-nav-btn" ${stepIndex > 0 ? `data-target="${stepIndex - 1}" title="Предыдущий этап"` : 'disabled'}>↑</button>`;
            navHtml += `<button class="stage-nav-btn" ${stepIndex < steps.length - 1 ? `data-target="${stepIndex + 1}" title="Следующий этап"` : 'disabled'}>↓</button>`;
            navHtml += `</div>`;

            let searchInputHTML = `<input type="text" class="filter-search" placeholder="Поиск...">`;
            let usersDrop = Array.from(stageUsers).sort().map(u => `<label><input type="checkbox" class="flt-u" value="${esc(u)}"> <span>${u}</span></label>`).join('');
            usersDrop = usersDrop ? searchInputHTML + usersDrop : `<div style="padding:5px; color:gray; font-size:11px;">Нет участников</div>`;
            let fieldsDrop = Array.from(stageFields).sort().map(f => `<label><input type="checkbox" class="flt-f" value="${esc(f)}"> <span>${f}</span></label>`).join('');
            fieldsDrop = fieldsDrop ? searchInputHTML + fieldsDrop : `<div style="padding:5px; color:gray; font-size:11px;">Нет полей</div>`;
            let stageLinkHTML = `<a class="stage-link" data-step="${stepIndex}" title="Перейти к этапу в Pyrus">${stepName}</a>`;

            htmlChunks.push(`<div class="stage-container" id="pro-stage-${stepIndex}">
                <div class="stage-title" style="z-index: ${1000 - stepIndex};">
                    <div class="stage-title-left"><div class="collapse-btn" title="Свернуть/Развернуть этап">▼</div><span>${stageLinkHTML}</span></div>
                    <div class="filters-wrapper">
                        ${navHtml}
                        <details class="filter-details user-filter-box"><summary class="filter-summary">👥 Участники ▼</summary><div class="filter-content">${usersDrop}</div></details>
                        <details class="filter-details field-filter-box"><summary class="filter-summary">⚙️ Поля ▼</summary><div class="filter-content">${fieldsDrop}</div></details>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="rules-table"><thead><tr><th class="col-num">№</th><th class="col-users">Участники</th><th>Условия</th></tr></thead><tbody>${rowsHTMLChunks.join('')}</tbody></table>
                </div>
            </div>`);
        }

        htmlChunks.push(`
            <div class="footer">
                <a href="https://t.me/MrMails" target="_blank" class="author-link" title="Связаться с разработчиком">
                    <span class="author-name">by Mr. Mails</span>
                    <span class="author-for">for ITCS</span>
                </a>
                <div class="version-text">Pyrus Routing Optimizer v1.5.3</div>
            </div>
        </body></html>`);

        let finalHTML = htmlChunks.join('');

        proRoutingWindow = window.open('', '_blank');
        if (proRoutingWindow) {
            proRoutingWindow.document.open();
            proRoutingWindow.document.write(finalHTML);
            proRoutingWindow.document.close();
            
            let formUrl = window.location.href;
            attachProEvents(proRoutingWindow.document, formUrl, window);
            
        } else {
            alert('Пожалуйста, разрешите всплывающие окна для Pyrus, чтобы открыть PRO-таблицу.');
        }

        btn.innerHTML = originalHtml;

    } catch (err) {
        console.error("PRO Ошибка:", err);
        btn.innerHTML = originalHtml;
    } finally {
        isBuildingPro = false;
    }
}

// 8. КНОПКА "PRO"
function checkAndInjectButton() {
    const steps = document.querySelectorAll('.weWorkflowStep');
    const isRoutingPage = window.location.hash.includes('#wf') && steps.length > 0;
    const existingBtn = document.getElementById('pyrus-pro-btn');
    
    if (isRoutingPage && !existingBtn) {
        if (!document.getElementById('pro-btn-style')) {
            let s = document.createElement('style');
            s.id = 'pro-btn-style';
            s.innerHTML = `
                #pyrus-pro-btn {
                    position: fixed; bottom: 30px; right: 30px; z-index: 2147483646; 
                    background: #0052cc; color: white; border: none; border-radius: 50px;
                    padding: 12px 24px; font-size: 14px; font-weight: bold;
                    box-shadow: 0 4px 12px rgba(0, 82, 204, 0.4); cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
                    white-space: nowrap; font-family: sans-serif;
                }
                #pyrus-pro-btn:hover { background: #0043a6; transform: translateY(-3px) translateZ(0); box-shadow: 0 6px 16px rgba(0, 82, 204, 0.6); }
                .pro-word-part {
                    display: inline-block; max-width: 0; opacity: 0; overflow: hidden;
                    vertical-align: bottom; transition: max-width 0.4s ease, opacity 0.3s ease;
                    will-change: max-width, opacity;
                }
                #pyrus-pro-btn:hover .pro-word-part { max-width: 80px; opacity: 1; }
                .pro-space { display: inline-block; width: 1px; transition: width 0.3s ease; }
                #pyrus-pro-btn:hover .pro-space { width: 4px; }
            `;
            document.head.appendChild(s);
        }
        let btn = document.createElement('button');
        btn.id = 'pyrus-pro-btn';
        btn.innerHTML = '<span>P<span class="pro-word-part">yrus</span><span class="pro-space"></span>R<span class="pro-word-part">outing</span><span class="pro-space"></span>O<span class="pro-word-part">ptimizer</span></span>';
        
        btn.onclick = expandProRouting;
        document.body.appendChild(btn);
    } else if (!isRoutingPage && existingBtn) {
        existingBtn.remove();
    }
}
setInterval(checkAndInjectButton, 1000);

// --- СИСТЕМА УВЕДОМЛЕНИЙ ОБ ОБНОВЛЕНИИ ---
function checkForUpdateBanner() {
    // ВНИМАНИЕ: Замените ссылку на свою страницу Releases на GitHub
    const GITHUB_RELEASES_URL = "https://github.com/MrMails/Pyrus_Routing_Optimizer/releases";
    
    chrome.storage.local.get(['updateAvailable', 'updateDismissed'], function(result) {
        if (result.updateAvailable && result.updateDismissed !== result.updateAvailable) {
            
            if (document.getElementById('pro-update-banner')) return;

            let banner = document.createElement('div');
            banner.id = 'pro-update-banner';
            banner.style.cssText = `
                position: fixed; top: 15px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
                background: linear-gradient(135deg, #0052cc, #66b3ff); color: white;
                padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                display: flex; align-items: center; gap: 15px; font-family: sans-serif; font-size: 14px; font-weight: bold;
                animation: slideDown 0.5s ease-out;
            `;
            
            banner.innerHTML = `
                <style>@keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 15px; opacity: 1; } }</style>
                <span>✨ Доступна новая версия Pyrus Routing PRO (v${result.updateAvailable})!</span>
                <a href="${GITHUB_RELEASES_URL}" target="_blank" style="background: white; color: #0052cc; padding: 5px 12px; border-radius: 4px; text-decoration: none; transition: 0.2s;">Скачать</a>
                <button id="pro-dismiss-update" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; padding: 0;">✕</button>
            `;

            document.body.appendChild(banner);

            document.getElementById('pro-dismiss-update').onclick = function() {
                banner.remove();
                chrome.storage.local.set({ updateDismissed: result.updateAvailable });
            };
        }
    });
}
setTimeout(checkForUpdateBanner, 2000);