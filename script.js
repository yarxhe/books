const YOUR_TELEGRAM_USERNAME = 'yarxhe3'; // Впиши ник!

let originalData = []; 
let bookPages =[]; 
let currentPageIndex = 0;

async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Сеть не отвечает');
        originalData = await response.json();
        buildBook();
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        document.getElementById('toc-list').innerHTML = 
            '<div style="color:red; padding:10px;">Ошибка. Запустите через локальный сервер.</div>';
    }
}

function buildBook() {
    bookPages =[];
    bookPages.push({ type: 'cover' }); 
    originalData.forEach((item) => { bookPages.push({ type: 'entry', data: item }); });
    bookPages.push({ type: 'epilation' }); 
    bookPages.push({ type: 'depilation' });

    renderTOC();
    goToPage(0); 
}

function renderTOC() {
    const tocList = document.getElementById('toc-list');
    tocList.innerHTML = '';
    
    bookPages.forEach((page, index) => {
        if (page.type === 'entry') {
            const div = document.createElement('div');
            div.className = 'toc-item';
            div.innerHTML = `<span>${page.data.name}</span><span class="toc-dots"></span><span>стр. ${index}</span>`;
            div.onclick = () => goToPage(index);
            tocList.appendChild(div);
        }
    });

    document.getElementById('toc-epilation-page').innerText = `стр. ${bookPages.length - 2}`;
    document.getElementById('toc-depilation-page').innerText = `стр. ${bookPages.length - 1}`;
}

function changePage(step) { goToPage(currentPageIndex + step); }
function goToForm(formType) {
    const targetIndex = bookPages.findIndex(p => p.type === formType);
    if (targetIndex !== -1) goToPage(targetIndex);
}

function goToPage(index) {
    if (index < 0) index = 0;
    if (index >= bookPages.length) index = bookPages.length - 1;
    
    currentPageIndex = index;
    const pageData = bookPages[index];

    document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.current-page-num').forEach(el => el.innerText = index);

    if (pageData.type === 'cover') document.getElementById('cover-view').classList.remove('hidden');
    else if (pageData.type === 'entry') {
        renderEntry(pageData.data);
        document.getElementById('page-view').classList.remove('hidden');
    } 
    else if (pageData.type === 'epilation') document.getElementById('epilation-view').classList.remove('hidden');
    else if (pageData.type === 'depilation') document.getElementById('depilation-view').classList.remove('hidden');

    closeMenuOnMobile();
    document.getElementById('main-content').scrollTop = 0;
}

function renderEntry(data) {
    const content = document.getElementById('page-display-content');
    content.innerHTML = `
        <div class="crime-date">Дата занесения: ${data.date}</div>
        <h1 style="font-family: 'Courier New', monospace;">${data.name}</h1>
        <h3 style="text-align:center; color:#888; margin-top:-15px; font-family: -apple-system, sans-serif;">(он же: ${data.nickname})</h3>
        <hr>
        <h2>📄 Преступление:</h2>
        <p style="font-size: 1.1em; border-left: 4px solid var(--accent); padding-left: 15px; line-height: 1.5;">${data.crime}</p>
        <h2>🕵️ Детали:</h2>
        <p style="line-height: 1.5;">${data.details}</p>
        <hr>
        <h2>⚖️ Вердикт Автора:</h2>
        <p style="color: var(--accent); font-weight: bold; font-size: 1.1em; text-transform: uppercase;">[ ${data.verdict} ]</p>
    `;
}

// УПРАВЛЕНИЕ МЕНЮ И ОВЕРЛЕЕМ (Vibe iOS)
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMenuOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');
    
    if(window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function getFormData(type) {
    if (type === 'epilation') {
        const name = document.getElementById('e_name').value || 'Аноним';
        const nick = document.getElementById('e_nickname').value || '-';
        const levelNode = document.querySelector('input[name="e_level"]:checked');
        const level = levelNode ? levelNode.value : 'Не указано';
        const page = document.getElementById('e_page').value || '?';
        const par = document.getElementById('e_paragraph').value || '?';
        const pain = document.getElementById('e_pain').value || '-';
        const measures = Array.from(document.querySelectorAll('#e_measures input:checked')).map(cb => cb.value).join(', ') || 'Нет';
        return `🪒 ЭПИЛЯЦИЯ (Упрощенка)\nОт: ${name} (${nick})\nОбида: ${level}\nГде: ${page}, абз ${par}\nБоль: ${pain}\nТребует: ${measures}`;
    } 
    if (type === 'depilation') {
        if (!document.getElementById('d_agree').checked) return 'ОШИБКА: Вы не поставили галочку согласия с реальностью!';
        const name = document.getElementById('d_name').value || 'Бессмертный';
        const reason = document.getElementById('d_reason').value || 'Просто так';
        const blameNode = document.querySelector('input[name="d_blame"]:checked');
        const blame = blameNode ? blameNode.value : 'Трус не выбрал';
        const trauma = document.getElementById('d_trauma').value || 'Молчит';
        const excuse = document.getElementById('d_excuse').value || 'Нет оправданий';
        const comp = Array.from(document.querySelectorAll('#d_compensation input:checked')).map(cb => cb.value).join(', ') || 'ЖАДИНА';
        return `🔥 ДЕПИЛЯЦИЯ (Жесткая форма)\nОт: ${name}\nПочему пишет: ${reason}\nОценка Автора: ${blame}\nТравма:\n${trauma}\nОправдания:\n${excuse}\nКомпенсация: ${comp}`;
    }
}

function copyForm(type) {
    const text = getFormData(type);
    if (text.startsWith('ОШИБКА')) { alert(text); return; }
    navigator.clipboard.writeText(text).then(() => alert('📜 Скопировано!')).catch(() => alert('Ошибка.'));
}

function sendForm(type) {
    const text = getFormData(type);
    if (text.startsWith('ОШИБКА')) { alert(text); return; }
    const tgLink = `https://t.me/${YOUR_TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
    window.open(tgLink, '_blank');
}

document.addEventListener('DOMContentLoaded', loadData);