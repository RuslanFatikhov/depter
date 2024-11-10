import os
import sqlite3
from flask import Flask, request, jsonify, render_template, g
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)

# Конфигурация загрузки файлов
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # Ограничение на 5 МБ

# Убедимся, что папка для загрузки существует
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Имя файла базы данных
DATABASE = 'depter.db'

# Подключение к базе данных
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

# Закрываем подключение к базе данных после завершения запроса
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Инициализация базы данных и создание таблиц, если они не существуют
def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        # Создаем таблицу 'blocks', если она не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                block_type TEXT,
                content TEXT,
                style TEXT
            )
        ''')

        # Создаем таблицу 'articles', если она не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY,
                title TEXT,
                last_saved TEXT
            )
        ''')

        db.commit()

# Вызов функции для инициализации базы данных
init_db()

# Маршрут для отображения главной страницы
@app.route('/')
def index():
    return render_template('index.html')

# Маршрут для загрузки изображения
@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'Файл не найден'}), 400

    file = request.files['image']

    # Проверяем тип файла
    if file.mimetype not in ['image/jpeg', 'image/png', 'image/webp', 'image/gif']:
        return jsonify({'status': 'error', 'message': 'Неверный формат файла'}), 400

    # Сохраняем файл с безопасным именем
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    return jsonify({'status': 'success', 'filePath': f'/static/uploads/{filename}'})

# Маршрут для сохранения данных
@app.route('/save', methods=['POST'])
def save():
    try:
        data = request.json
        content_blocks = data.get('content', [])
        title = data.get('title', 'Без заголовка')

        last_saved_str = data.get('last_saved', None)
        if last_saved_str:
            last_saved = datetime.fromisoformat(last_saved_str)
        else:
            last_saved = datetime.utcnow()
        last_saved_iso = last_saved.isoformat()

        db = get_db()
        cursor = db.cursor()

        # Очищаем таблицу 'blocks' перед сохранением новых данных
        cursor.execute('DELETE FROM blocks')

        # Сохраняем каждый блок в базу данных
        for block in content_blocks:
            if block['type'] == 'image':
                content = block['data']
                cursor.execute('INSERT INTO blocks (block_type, content) VALUES (?, ?)',
                               (block['type'], content))
            elif block['type'] == 'text':
                content = block['data']
                style = block.get('style', 'p')  # Если стиль не указан, используем 'p'
                cursor.execute('INSERT INTO blocks (block_type, content, style) VALUES (?, ?, ?)',
                               (block['type'], content, style))

        # Обновляем или вставляем запись в таблицу 'articles'
        cursor.execute('SELECT id FROM articles WHERE id = 1')
        if cursor.fetchone():
            # Обновляем существующую статью
            cursor.execute('UPDATE articles SET title = ?, last_saved = ? WHERE id = 1',
                           (title, last_saved_iso))
        else:
            # Вставляем новую статью
            cursor.execute('INSERT INTO articles (id, title, last_saved) VALUES (1, ?, ?)',
                           (title, last_saved_iso))

        db.commit()

        return jsonify({'status': 'success', 'message': 'Content saved successfully'})
    except Exception as e:
        print(f"Ошибка при сохранении: {e}")
        return jsonify({'status': 'error', 'message': 'Ошибка при сохранении данных'}), 500

# Маршрут для загрузки данных
@app.route('/load', methods=['GET'])
def load():
    try:
        db = get_db()
        cursor = db.cursor()

        # Загружаем контентные блоки
        cursor.execute('SELECT block_type, content, style FROM blocks')
        blocks = cursor.fetchall()

        # Преобразуем данные в список словарей
        content = []
        for block in blocks:
            block_type, content_data, style = block
            if block_type == 'text':
                content.append({'type': 'text', 'data': content_data, 'style': style})
            else:
                content.append({'type': block_type, 'data': content_data})

        # Загружаем заголовок и время последнего сохранения
        cursor.execute('SELECT title, last_saved FROM articles WHERE id = 1')
        article = cursor.fetchone()
        if article:
            title, last_saved_iso = article
            if last_saved_iso:
                last_saved = datetime.fromisoformat(last_saved_iso).strftime('%d %B %Y, %H:%M:%S')
            else:
                last_saved = 'Никогда'
        else:
            title = 'Без заголовка'
            last_saved = 'Никогда'

        return jsonify({'status': 'success', 'content': content, 'title': title, 'last_saved': last_saved})
    except Exception as e:
        print(f"Ошибка при загрузке: {e}")
        return jsonify({'status': 'error', 'message': 'Ошибка при загрузке данных'}), 500

if __name__ == '__main__':
    app.run(debug=True)
