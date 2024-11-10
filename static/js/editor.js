document.addEventListener('DOMContentLoaded', function () {
    const editor = document.getElementById('editor')
    const formatMenu = document.getElementById('formatMenu')

    // Функция для загрузки контента с сервера
    async function loadContent() {
        try {
            const response = await fetch('/load')
            const result = await response.json()
            if (result.status === 'success') {
                result.content.forEach(block => {
                    if (block.type === 'text') {
                        addTextBlock(block.data)
                    } else if (block.type === 'image') {
                        addImageBlock(block.data)
                    }
                })
            }
        } catch (error) {
            console.error('Ошибка при загрузке контента:', error)
        }
    }

    // Функция для добавления текстового блока
    function addTextBlock(text = 'Напишите здесь...') {
        const block = document.createElement('div')
        block.classList.add('block')
        block.setAttribute('contenteditable', 'true')
        block.dataset.type = 'text'
        block.innerText = text

        block.addEventListener('focus', function () {
            if (block.innerText === 'Напишите здесь...') {
                block.innerText = ''
            }
        })

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerHTML = `<img src="/static/img/icon/trash.svg" alt="Удалить" />`
        deleteButton.onclick = () => block.remove()
        block.appendChild(deleteButton)

        editor.appendChild(block)
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
            dropZone.innerHTML = `<div class="drop-zone-body">
            <img class="drop-zone-icon" src="/static/img/redactor/dadimg.svg" alt="Загрузить" />
            <p class="textprime300">Перетащите изображение</p>
            <span class="row gap8"><img src="/static/img/redactor/line.svg" alt="Загрузить" />
            <p class="textprime300"> или </p><img src="/static/img/redactor/line.svg" alt="Загрузить" />
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
                // Создаем элемент div
                const imageError = document.createElement('div');
                imageError.className = 'image-error bgerror200';
            
                // Создаем элемент img и устанавливаем его src
                const errorIcon = document.createElement('img');
                errorIcon.src = '/static/img/redactor/error.svg';
                errorIcon.alt = 'Ошибка';
            
                // Создаем текстовый узел
                const errorMessage = document.createElement('p');
                errorMessage.className = 'error100';
                errorMessage.textContent = 'Файл превышает 5 МБ';
            
                // Вставляем img и текст внутрь div
                imageError.appendChild(errorIcon);
                imageError.appendChild(errorMessage);
            
                // Добавляем div в нужное место на странице
                document.body.appendChild(imageError); // или замените document.body на конкретный элемент, если нужно
        
                // Устанавливаем таймер для скрытия сообщения через 5 секунд
                setTimeout(() => {
                    imageError.remove(); // Удаляем элемент из DOM
                }, 5000);
        
                return;
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
                    dropZone.innerHTML = ''  // Очищаем dropZone
                    dropZone.classList.remove('drop-zone')
                    dropZone.classList.add('image-container')  // Меняем стиль на контейнер изображения
        
                    const img = document.createElement('img')
                    img.src = data.filePath
                    img.alt = 'Загруженное изображение'
                    dropZone.appendChild(img)
        
                    statusMessage.textContent = 'Картинка загружена'
                    statusMessage.style.color = 'green'
        
                    // Устанавливаем таймер для скрытия сообщения через 5 секунд
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
    
        // Добавляем элементы в блок
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
                content.push({ type: 'text', data: block.innerText })
            } else if (block.dataset.type === 'image') {
                const img = block.querySelector('img')
                if (img) {
                    content.push({ type: 'image', data: img.src })
                }
            }
        })

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

    document.getElementById('addTextBlock').addEventListener('click', () => addTextBlock())
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
