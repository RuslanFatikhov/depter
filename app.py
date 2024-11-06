import sqlite3
from flask import Flask, request, jsonify, render_template, g

app = Flask(__name__)

# Имя файла базы данных
DATABASE = 'depter.db'

# Функция для подключения к базе данных
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
        cursor.execute('''CREATE TABLE IF NOT EXISTS blocks
                          (id INTEGER PRIMARY KEY AUTOINCREMENT,
                           block_type TEXT,
                           content TEXT)''')
        db.commit()

# Вызов функции для инициализации базы данных
init_db()

# Маршрут для отображения главной страницы
@app.route('/')
def index():
    return render_template('index.html')

# Маршрут для сохранения данных
@app.route('/save', methods=['POST'])
def save():
    data = request.json.get('content', [])
    db = get_db()
    cursor = db.cursor()
    
    # Очищаем таблицу перед сохранением новых данных
    cursor.execute('DELETE FROM blocks')
    db.commit()

    # Сохраняем каждый блок в базу данных
    for block in data:
        cursor.execute('INSERT INTO blocks (block_type, content) VALUES (?, ?)',
                       (block['type'], block['data']))
    db.commit()

    return jsonify({'status': 'success', 'message': 'Content saved successfully'})

@app.route('/load', methods=['GET'])
def load():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT block_type, content FROM blocks')
    blocks = cursor.fetchall()
    
    # Преобразуем данные в список словарей
    content = [{'type': block_type, 'data': content} for block_type, content in blocks]
    return jsonify({'status': 'success', 'content': content})


if __name__ == '__main__':
    app.run(debug=True)
