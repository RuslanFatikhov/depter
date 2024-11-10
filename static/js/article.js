document.addEventListener('DOMContentLoaded', () => {
    const articleTitle = document.getElementById('article-title');
    const lastSavedTime = document.getElementById('last-saved-time');

    // Функция для обновления заголовка страницы
    function updatePageTitle() {
        document.title = articleTitle.innerText || 'Без заголовка';
    }

    // Функция для обновления отображения времени последнего сохранения
    function updateLastSavedTimeDisplay(time) {
        lastSavedTime.innerText = `Последнее сохранение: ${time}`;
    }

    // Функция для загрузки статьи с сервера
    async function loadArticle() {
        try {
            const response = await fetch('/load');
            if (!response.ok) throw new Error('Не удалось загрузить данные');

            const data = await response.json();
            if (data.status === 'success') {
                articleTitle.innerText = data.title || 'Без заголовка';
                updatePageTitle();

                if (data.last_saved && data.last_saved !== 'Никогда') {
                    updateLastSavedTimeDisplay(data.last_saved);
                } else {
                    updateLastSavedTimeDisplay('Никогда');
                }

                // Загрузка контентных блоков (если необходимо)
                // loadContentBlocks(data.content);
            } else {
                console.error('Ошибка при загрузке данных:', data.message);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    }

    // Функция для сохранения статьи на сервере
    async function saveArticle() {
        const title = articleTitle.innerText.trim() || 'Без заголовка';
        const now = new Date();
        const lastSaved = now.toISOString(); // Используем формат ISO

        const data = {
            title: title,
            last_saved: lastSaved,
            content: [] // Здесь добавьте код для сбора контентных блоков, если они есть
        };

        console.log('Данные для сохранения:', data);

        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Не удалось сохранить данные');

            const result = await response.json();
            if (result.status === 'success') {
                // Обновляем отображение времени последнего сохранения
                updateLastSavedTimeDisplay(now.toLocaleString('ru-RU'));
                console.log('Данные успешно сохранены');
            } else {
                console.error('Ошибка при сохранении данных:', result.message);
            }
        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
        }
    }

    // Обработчики событий
    articleTitle.addEventListener('input', () => {
        updatePageTitle();
        // Вы можете добавить авто-сохранение с задержкой
        // Например, используя setTimeout
    });
    articleTitle.addEventListener('blur', saveArticle);

    // Загрузка статьи при загрузке страницы
    loadArticle();
});
