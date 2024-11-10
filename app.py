import os
import sqlite3
from flask import Flask, request, jsonify, render_template, g
from werkzeug.utils import secure_filename

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

# Инициализация базы данных и создание таблицы, если она не существует
def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        # Создаем таблицу, если она не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                block_type TEXT,
                content TEXT
            )
        ''')

        # Проверяем, есть ли столбец 'style' в таблице 'blocks'
        cursor.execute("PRAGMA table_info(blocks)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'style' not in columns:
            cursor.execute('ALTER TABLE blocks ADD COLUMN style TEXT')

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

    # Сохраняем файл
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    return jsonify({'status': 'success', 'filePath': f'/static/uploads/{filename}'})

# Маршрут для сохранения данных
@app.route('/save', methods=['POST'])
def save():
    try:
        data = request.json.get('content', [])
        db = get_db()
        cursor = db.cursor()

        # Очищаем таблицу перед сохранением новых данных
        cursor.execute('DELETE FROM blocks')
        db.commit()

        # Сохраняем каждый блок в базу данных
        for block in data:
            if block['type'] == 'image':
                content = block['data']
                cursor.execute('INSERT INTO blocks (block_type, content) VALUES (?, ?)',
                               (block['type'], content))
            elif block['type'] == 'text':
                content = block['data']
                style = block.get('style', 'p')  # Если стиль не указан, используем 'p'
                cursor.execute('INSERT INTO blocks (block_type, content, style) VALUES (?, ?, ?)',
                               (block['type'], content, style))
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
        return jsonify({'status': 'success', 'content': content})
    except Exception as e:
        print(f"Ошибка при загрузке: {e}")
        return jsonify({'status': 'error', 'message': 'Ошибка при загрузке данных'}), 500

if __name__ == '__main__':
    app.run(debug=True)
