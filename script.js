// --- НАСТРОЙКИ ---
const YOUR_TELEGRAM_USERNAME = 'tvoj_nik'; // Впиши сюда свой ник без @

let originalData =[]; 
let bookPages =[]; // Массив ВСЕХ страниц книги (0 = обложка, 1..N = обидчики, N+1 = эпиляция...)
let currentPageIndex = 0;

// --- ЗАГРУЗКА ДАННЫХ ---
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

// --- СБОРКА КНИГИ ПО СТРАНИЦАМ ---
function buildBook() {
    bookPages =[];
    
    // Стр. 0: Обложка
    bookPages.push({ type: 'cover' }); 
    
    // Стр. 1 до N: Обидчики
    originalData.forEach((item) => {
        bookPages.push({ type: 'entry', data: item });
    });
    
    // Последние страницы: Формы
    bookPages.push({ type: 'epilation' }); 
    bookPages.push({ type: 'depilation' });

    renderTOC();
    goToPage(0); // Открываем обложку при старте
}

// --- ОГЛАВЛЕНИЕ ---
function renderTOC() {
    const tocList = document.getElementById('toc-list');
    tocList.innerHTML = '';
    
    // Генерируем список обидчиков
    bookPages.forEach((page, index) => {
        if (page.type === 'entry') {
            const div = document.createElement('div');
            div.className = 'toc-item';
            
            // Формат: Имя ....... стр. X
            div.innerHTML = `
                <span>${page.data.name}</span>
                <span class="toc-dots"></span>
                <span>стр. ${index}</span>
            `;
            div.onclick = () => goToPage(index);
            tocList.appendChild(div);
        }
    });

    // Обновляем номера страниц для форм в самом низу меню
    document.getElementById('toc-epilation-page').innerText = `стр. ${bookPages.length - 2}`;
    document.getElementById('toc-depilation-page').innerText = `стр. ${bookPages.length - 1}`;
}

// --- ПЕРЕЛИСТЫВАНИЕ СТРАНИЦ ---
function changePage(step) {
    goToPage(currentPageIndex + step);
}

function goToForm(formType) {
    const targetIndex = bookPages.findIndex(p => p.type === formType);
    if (targetIndex !== -1) goToPage(targetIndex);
}

// Главная функция навигации
function goToPage(index) {
    // Ограничители (чтобы не уйти в минус или за пределы книги)
    if (index < 0) index = 0;
    if (index >= bookPages.length) index = bookPages.length - 1;
    
    currentPageIndex = index;
    const pageData = bookPages[index];

    // Прячем все экраны
    document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));

    // Обновляем номера страниц в интерфейсе
    document.querySelectorAll('.current-page-num').forEach(el => {
        el.innerText = index;
    });

    // Логика отображения нужного экрана
    if (pageData.type === 'cover') {
        document.getElementById('cover-view').classList.remove('hidden');
    } 
    else if (pageData.type === 'entry') {
        renderEntry(pageData.data);
        document.getElementById('page-view').classList.remove('hidden');
    } 
    else if (pageData.type === 'epilation') {
        document.getElementById('epilation-view').classList.remove('hidden');
    } 
    else if (pageData.type === 'depilation') {
        document.getElementById('depilation-view').classList.remove('hidden');
    }

    // На телефонах закрываем меню при выборе
    closeMenuOnMobile();
    
    // Прокручиваем наверх листа (удобно на мобилке при перелистывании)
    document.getElementById('main-content').scrollTop = 0;
}

// Отрисовка конкретного обидчика
function renderEntry(data) {
    const content = document.getElementById('page-display-content');
    content.innerHTML = `
        <div class="crime-date">Дата занесения: ${data.date}</div>
        <h1>${data.name}</h1>
        <h3 style="text-align:center; color:#888; margin-top:-15px;">(он же: ${data.nickname})</h3>
        <hr>
        <h2>📄 Преступление:</h2>
        <p style="font-size: 1.2em; border-left: 4px solid var(--accent); padding-left: 15px;">${data.crime}</p>
        <h2>🕵️ Детали:</h2>
        <p>${data.details}</p>
        <hr>
        <h2>⚖️ Вердикт Автора:</h2>
        <p style="color: var(--accent); font-weight: bold; font-size: 1.1em; text-transform: uppercase;">[ ${data.verdict} ]</p>
    `;
}

// --- УПРАВЛЕНИЕ МОБИЛЬНЫМ МЕНЮ ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-toggle');
    sidebar.classList.toggle('active');
    
    if(sidebar.classList.contains('active')) {
        menuBtn.innerText = '✖ ЗАКРЫТЬ';
        menuBtn.style.color = 'var(--accent)';
    } else {
        menuBtn.innerText = '☰ ОГЛАВЛЕНИЕ';
        menuBtn.style.color = 'var(--text-color)';
    }
}

function closeMenuOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-toggle');
    if(window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        menuBtn.innerText = '☰ ОГЛАВЛЕНИЕ';
        menuBtn.style.color = 'var(--text-color)';
    }
}

// --- СБОР И ОТПРАВКА ФОРМ ---
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

        return `🪒 ЭПИЛЯЦИЯ (Упрощенка)
От: ${name} (${nick})
Обида: ${level}
Где: ${page}, абз ${par}
Боль: ${pain}
Требует: ${measures}`;
    } 
    
    if (type === 'depilation') {
        const agree = document.getElementById('d_agree').checked;
        if (!agree) return 'ОШИБКА: Вы не поставили галочку согласия с реальностью!';

        const name = document.getElementById('d_name').value || 'Бессмертный';
        const reason = document.getElementById('d_reason').value || 'Просто так';
        const blameNode = document.querySelector('input[name="d_blame"]:checked');
        const blame = blameNode ? blameNode.value : 'Трус не выбрал';
        const trauma = document.getElementById('d_trauma').value || 'Молчит';
        const excuse = document.getElementById('d_excuse').value || 'Нет оправданий';
        const comp = Array.from(document.querySelectorAll('#d_compensation input:checked')).map(cb => cb.value).join(', ') || 'ЖАДИНА';

        return `🔥 ДЕПИЛЯЦИЯ (Жесткая форма)
От: ${name}
Почему пишет: ${reason}
Оценка Автора: ${blame}

Детальная травма:
${trauma}

Смягчающие:
${excuse}

Готов компенсировать:
${comp}`;
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

// СТАРТ
document.addEventListener('DOMContentLoaded', loadData);