document.addEventListener('DOMContentLoaded', function () {
    const editor = document.getElementById('editor')

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

    // Функция для добавления текстового блока с удалением
    function addTextBlock(text = 'Напишите здесь...') {
        const block = document.createElement('div')
        block.classList.add('block')
        block.setAttribute('contenteditable', 'true')
        block.dataset.type = 'text'
        block.innerText = text
    
        // Добавляем обработчик клика для удаления текста по умолчанию
        block.addEventListener('focus', function () {
            if (block.innerText === 'Напишите здесь...') {
                block.innerText = ''  // Очищаем текст при клике
            }
        })
    
        // Добавляем кнопку удаления
        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerHTML = `<img src="/static/img/icon/trash.svg" alt="Удалить" />`
        deleteButton.onclick = () => block.remove()  // Удаляем блок при нажатии
        block.appendChild(deleteButton)
    
        editor.appendChild(block)
    }
    

    // Функция для добавления блока изображения с удалением
    function addImageBlock(src = null) {
        const block = document.createElement('div')
        block.classList.add('block')
        block.dataset.type = 'image'

        if (src) {
            const img = document.createElement('img')
            img.src = src
            block.appendChild(img)
        } else {
            const imgInput = document.createElement('input')
            imgInput.type = 'file'
            imgInput.accept = 'image/*'
            imgInput.onchange = function () {
                const file = imgInput.files[0]
                const reader = new FileReader()
                reader.onload = function (e) {
                    const img = document.createElement('img')
                    img.src = e.target.result
                    block.appendChild(img)
                    imgInput.remove()  // Убираем input после загрузки изображения
                }
                reader.readAsDataURL(file)
            }
            block.appendChild(imgInput)
        }

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerText = 'Удалить'
        deleteButton.onclick = () => block.remove()  // Удаляем блок при нажатии
        block.appendChild(deleteButton)

        editor.appendChild(block)
    }


    // Функция для сохранения контента
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
            console.log(result.message)  // Сообщение об успехе
    
            // Показываем плашку "Изменения сохранены"
            const notification = document.getElementById('saveNotification')
            notification.style.display = 'flex'
    
            // Скрываем плашку через 3 секунды
            setTimeout(() => {
                notification.style.display = 'none'
            }, 3000)
    
        } catch (error) {
            console.error('Ошибка при сохранении:', error)
        }
    }
    

    // Привязываем функции к кнопкам
    document.getElementById('addTextBlock').addEventListener('click', () => addTextBlock())
    document.getElementById('addImageBlock').addEventListener('click', () => addImageBlock())
    document.getElementById('saveContent').addEventListener('click', saveContent)

    // Загружаем контент при открытии страницы
    loadContent()
})
