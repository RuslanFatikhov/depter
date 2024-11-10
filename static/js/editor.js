document.addEventListener('DOMContentLoaded', function () {
    const editor = document.getElementById('editor')

    // Создаем меню выбора стиля текста
    const textStyleMenu = document.createElement('div')
    textStyleMenu.classList.add('text-style-menu')
    textStyleMenu.style.display = 'none'  // Меню скрыто по умолчанию

    // Вставляем меню в DOM
    textStyleMenu.innerHTML = `
        <button data-style="h1">
            <img src="/static/img/redactor/style=h1.svg" alt="Заголовок (H1)">
        </button>
        <button data-style="h2">
            <img src="/static/img/redactor/style=h2.svg" alt="Подзаголовок (H2)">
        </button>
        <button data-style="p">
            <img src="/static/img/redactor/style=p.svg" alt="Текст (P)">
        </button>
        <button data-style="caption">
            <img src="/static/img/redactor/style=caption.svg" alt="Выноска (P.caption)">
        </button>
    `
    document.body.appendChild(textStyleMenu)

    // Показать меню выбора стиля текста при нажатии на кнопку "Добавить текстовый блок"
    const addTextBlockButton = document.getElementById('addTextBlock')
    addTextBlockButton.addEventListener('click', (e) => {
        e.stopPropagation()
        textStyleMenu.style.display = textStyleMenu.style.display === 'none' ? 'block' : 'none' // Переключение видимости
    })

    // Скрываем меню, если клик происходит за его пределами
    document.addEventListener('click', (e) => {
        if (!textStyleMenu.contains(e.target) && e.target !== addTextBlockButton) {
            textStyleMenu.style.display = 'none'  // Скрываем меню
        }
    })

    // Обработка выбора стиля текста
    textStyleMenu.addEventListener('click', (e) => {
        const button = e.target.closest('button')
        if (button) {
            const style = button.getAttribute('data-style')
            if (style) {
                addStyledTextBlock(style)
                textStyleMenu.style.display = 'none'  // Скрываем меню после выбора
            }
        }
    })

    // Функция для добавления текстового блока с выбранным стилем
    function addStyledTextBlock(style, text = 'Напишите здесь...') {
        const block = document.createElement('div')
        block.classList.add('block', 'text-block')
        block.dataset.type = 'text'
        block.dataset.style = style  // Сохраняем стиль для загрузки

        // Создаем элемент текста
        let textElement
        if (style === 'h1') {
            textElement = document.createElement('h1')
        } else if (style === 'h2') {
            textElement = document.createElement('h2')
        } else if (style === 'caption') {
            textElement = document.createElement('p')
            textElement.classList.add('caption')
        } else {
            textElement = document.createElement('p')
        }

        textElement.setAttribute('contenteditable', 'true')
        textElement.innerText = text

        // Убираем плейсхолдер при фокусе
        textElement.addEventListener('focus', function () {
            if (textElement.innerText === 'Напишите здесь...') {
                textElement.innerText = ''
            }
        })

        // Восстанавливаем плейсхолдер, если блок пуст
        textElement.addEventListener('blur', function () {
            if (textElement.innerText.trim() === '') {
                textElement.innerText = 'Напишите здесь...'
            }
        })

        // Кнопка удаления для блока
        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerHTML = `<img src="/static/img/icon/trash.svg" alt="Удалить" />`
        deleteButton.onclick = () => block.remove()

        // Добавляем текстовый элемент и кнопку удаления в блок
        block.appendChild(textElement)
        block.appendChild(deleteButton)

        editor.appendChild(block)
        textElement.focus()
    }

    // Функция для загрузки контента с сервера
    async function loadContent() {
        try {
            const response = await fetch('/load')
            const result = await response.json()
            if (result.status === 'success') {
                result.content.forEach(block => {
                    if (block.type === 'text') {
                        addStyledTextBlock(block.style, block.data)
                    } else if (block.type === 'image') {
                        addImageBlock(block.data)
                    }
                })
            }
        } catch (error) {
            console.error('Ошибка при загрузке контента:', error)
        }
    }

    // Функция для добавления блока изображения с drag-and-drop загрузкой
    function addImageBlock(src = null) {
        const block = document.createElement('div')
        block.classList.add('block', 'image-block')
        block.dataset.type = 'image'

        const dropZone = document.createElement('div')

        // Проверяем, загружено ли изображение (если src передан, это означает, что оно сохранено)
        if (src) {
            dropZone.classList.add('image-container')

            // Отображаем изображение, если оно уже загружено
            const img = document.createElement('img')
            img.src = src
            img.alt = 'Загруженное изображение'
            dropZone.appendChild(img)
        } else {
            dropZone.classList.add('drop-zone')
            dropZone.innerHTML = `
                <div class="drop-zone-body">
                    <img class="drop-zone-icon" src="/static/img/redactor/dadimg.svg" alt="Загрузить" />
                    <p class="textprime300">Перетащите изображение</p>
                    <span class="row gap8">
                        <img src="/static/img/redactor/line.svg" alt="Загрузить" />
                        <p class="textprime300">или</p>
                        <img src="/static/img/redactor/line.svg" alt="Загрузить" />
                    </span>
                    <p class="savebutton textprime300">Выбрать файлы</p>
                </div>`

            // Добавляем обработчики событий для drag-and-drop загрузки
            dropZone.addEventListener('click', () => imgInput.click())
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault()
                dropZone.classList.add('drag-over')
            })

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over')
            })

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault()
                dropZone.classList.remove('drag-over')
                const file = e.dataTransfer.files[0]
                handleFile(file)
            })
        }

        // Создаем элемент input для выбора файла
        const imgInput = document.createElement('input')
        imgInput.type = 'file'
        imgInput.accept = 'image/jpeg, image/png, image/webp, image/gif'
        imgInput.style.display = 'none'
        imgInput.addEventListener('change', () => {
            const file = imgInput.files[0]
            handleFile(file)
        })

        // Функция для обработки файла при загрузке
        function handleFile(file) {
            if (file.size > 5 * 1024 * 1024) {
                const imageError = document.createElement('div')
                imageError.className = 'image-error bgerror200'

                const errorIcon = document.createElement('img')
                errorIcon.src = '/static/img/redactor/error.svg'
                errorIcon.alt = 'Ошибка'

                const errorMessage = document.createElement('p')
                errorMessage.className = 'error100'
                errorMessage.textContent = 'Файл превышает 5 МБ'

                imageError.appendChild(errorIcon)
                imageError.appendChild(errorMessage)

                document.body.appendChild(imageError)

                setTimeout(() => {
                    imageError.remove()
                }, 5000)

                return
            }

            statusMessage.textContent = 'Загрузка...'
            statusMessage.style.color = 'black'

            const formData = new FormData()
            formData.append('image', file)

            fetch('/upload-image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    dropZone.innerHTML = ''
                    dropZone.classList.remove('drop-zone')
                    dropZone.classList.add('image-container')

                    const img = document.createElement('img')
                    img.src = data.filePath
                    img.alt = 'Загруженное изображение'
                    dropZone.appendChild(img)

                    statusMessage.textContent = 'Картинка загружена'
                    statusMessage.style.color = 'green'

                    setTimeout(() => {
                        statusMessage.textContent = ''
                    }, 5000)
                } else {
                    statusMessage.textContent = `Ошибка: ${data.message}`
                    statusMessage.style.color = 'red'
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки:', error)
                statusMessage.textContent = 'Ошибка при загрузке'
                statusMessage.style.color = 'red'
            })
        }

        // Элемент для отображения статуса загрузки
        const statusMessage = document.createElement('div')
        statusMessage.classList.add('status-message')

        // Кнопка удаления
        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerHTML = `<img src="/static/img/icon/trash.svg" alt="Удалить" />`
        deleteButton.onclick = () => block.remove()

        block.appendChild(dropZone)
        block.appendChild(statusMessage)
        block.appendChild(deleteButton)
        block.appendChild(imgInput)
        editor.appendChild(block)
    }

    async function saveContent() {
        const blocks = document.querySelectorAll('.block')
        const content = []

        blocks.forEach(block => {
            if (block.dataset.type === 'text') {
                const textElement = block.querySelector('[contenteditable]')
                content.push({
                    type: 'text',
                    data: textElement.innerText,
                    style: block.dataset.style
                })
            } else if (block.dataset.type === 'image') {
                const img = block.querySelector('img')
                if (img && img.src && !img.src.includes('dadimg.svg')) {
                    content.push({ type: 'image', data: img.src })
                } else {
                    // Если изображение не загружено, удаляем пустой блок
                    block.remove()
                }
            }
        })

        // Отправляем контент на сервер
        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            })

            const result = await response.json()
            console.log(result.message)

            const notification = document.getElementById('saveNotification')
            notification.style.top = '20px'
            notification.style.opacity = '1'

            setTimeout(() => {
                notification.style.opacity = '0'
                notification.style.top = '-40px'
            }, 3000)

        } catch (error) {
            console.error('Ошибка при сохранении:', error)
        }
    }

    document.getElementById('addImageBlock').addEventListener('click', () => addImageBlock())
    document.getElementById('saveContent').addEventListener('click', saveContent)

    document.addEventListener('keydown', function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault()
            saveContent()
        }
    })

    loadContent()
})
