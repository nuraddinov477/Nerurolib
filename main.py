from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import base64
import json
from datetime import datetime

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# Katta hajmdagi PDF yuklash uchun limit (50MB)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

DB_NAME = "books.db"
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Jadvallarni yaratish (Node.js server.js bilan bir xil)
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL DEFAULT 0,
      cover TEXT DEFAULT '📕',
      description TEXT,
      stock INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      pdf_data BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      country TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id INTEGER,
      page_url TEXT NOT NULL,
      page_title TEXT,
      referrer TEXT,
      time_spent INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS book_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      user_id INTEGER,
      session_id TEXT NOT NULL,
      pages_read INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)
    
    # Admin user qo'shish (agar yo'q bo'lsa)
    cursor.execute(
        'INSERT OR IGNORE INTO users (username, email, password, full_name, is_admin) VALUES (?, ?, ?, ?, ?)',
        ('admin', 'admin@example.com', 'admin123', 'Administrator', 1)
    )
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

# Admin tekshiruvi uchun dekorator
def requires_admin(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('x-admin-token') or request.args.get('admin_token')
        if not token or token != ADMIN_PASSWORD:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Python Flask server is running'})

# Serve React frontend
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('public', path)):
        return send_from_directory('public', path)
    # React router fallback - serve index.html for unknown routes
    return send_from_directory('public', 'index.html')

# --- Books Routes ---
@app.route('/api/books', methods=['GET'])
def get_books():
    conn = get_db()
    books = conn.execute('SELECT * FROM books').fetchall()
    conn.close()
    
    result = []
    for book in books:
        b = dict(book)
        b['has_pdf'] = bool(b['pdf_data'])
        del b['pdf_data']
        b['is_admin'] = False 
        result.append(b)
    return jsonify(result)

@app.route('/api/books/<int:id>', methods=['GET'])
def get_book(id):
    conn = get_db()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if book is None:
        return jsonify({'error': 'Book not found'}), 404
        
    b = dict(book)
    b['has_pdf'] = bool(b['pdf_data'])
    del b['pdf_data']
    return jsonify(b)

@app.route('/api/books', methods=['POST'])
@requires_admin
def create_book():
    data = request.json
    title = data.get('title')
    author = data.get('author')
    
    if not title or not author:
        return jsonify({'error': 'Title and author are required'}), 400
        
    pdf_data = data.get('pdf_data')
    pdf_buffer = None
    if pdf_data:
        if ',' in pdf_data:
            pdf_data = pdf_data.split(',')[1]
        pdf_buffer = base64.b64decode(pdf_data)
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO books (title, author, category, price, cover, description, stock, pdf_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (title, author, data.get('category', 'Other'), data.get('price', 0), data.get('cover', '📕'), data.get('description', ''), data.get('stock', 0), pdf_buffer)
    )
    book_id = cursor.lastrowid
    conn.commit()
    
    new_book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    conn.close()
    
    b = dict(new_book)
    b['has_pdf'] = bool(b['pdf_data'])
    del b['pdf_data']
    return jsonify(b), 201

@app.route('/api/books/<int:id>', methods=['PUT'])
@requires_admin
def update_book(id):
    data = request.json
    conn = get_db()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (id,)).fetchone()
    
    if not book:
        conn.close()
        return jsonify({'error': 'Book not found'}), 404
        
    pdf_data = data.get('pdf_data')
    pdf_buffer = book['pdf_data']
    if pdf_data:
        if ',' in pdf_data:
            pdf_data = pdf_data.split(',')[1]
        pdf_buffer = base64.b64decode(pdf_data)
        
    conn.execute(
        'UPDATE books SET title = ?, author = ?, category = ?, price = ?, cover = ?, description = ?, stock = ?, pdf_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        (
            data.get('title', book['title']),
            data.get('author', book['author']),
            data.get('category', book['category']),
            data.get('price', book['price']),
            data.get('cover', book['cover']),
            data.get('description', book['description']),
            data.get('stock', book['stock']),
            pdf_buffer,
            id
        )
    )
    conn.commit()
    
    updated_book = conn.execute('SELECT * FROM books WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    b = dict(updated_book)
    b['has_pdf'] = bool(b['pdf_data'])
    del b['pdf_data']
    return jsonify(b)

@app.route('/api/books/<int:id>', methods=['DELETE'])
@requires_admin
def delete_book(id):
    conn = get_db()
    conn.execute('DELETE FROM books WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return '', 204

@app.route('/api/books/<int:id>/pdf', methods=['GET'])
def get_book_pdf(id):
    conn = get_db()
    book = conn.execute('SELECT title, pdf_data FROM books WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if not book or not book['pdf_data']:
        return jsonify({'error': 'PDF not available'}), 404
        
    response = make_response(book['pdf_data'])
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', 'attachment', filename=f"{book['title']}.pdf")
    return response

# --- Categories Routes ---
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    categories = conn.execute('SELECT * FROM categories').fetchall()
    conn.close()
    return jsonify([dict(c) for c in categories])

@app.route('/api/categories', methods=['POST'])
@requires_admin
def create_category():
    name = request.json.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
        
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO categories (name) VALUES (?)', (name,))
        cat_id = cursor.lastrowid
        conn.commit()
        new_cat = conn.execute('SELECT * FROM categories WHERE id = ?', (cat_id,)).fetchone()
        return jsonify(dict(new_cat)), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Category exists'}), 409
    finally:
        conn.close()

@app.route('/api/categories/<int:id>', methods=['DELETE'])
@requires_admin
def delete_category(id):
    conn = get_db()
    conn.execute('DELETE FROM categories WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return '', 204

# --- Users Routes ---
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db()
    users = conn.execute('SELECT id, username, email, full_name, is_admin, created_at FROM users').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/users', methods=['POST'])
@requires_admin
def create_user():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password, full_name, is_admin) VALUES (?, ?, ?, ?, ?)',
            (data['username'], data['email'], data['password'], data.get('full_name', ''), 1 if data.get('is_admin') else 0)
        )
        user_id = cursor.lastrowid
        conn.commit()
        new_user = conn.execute('SELECT id, username, email, full_name, is_admin, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        return jsonify(dict(new_user)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
@requires_admin
def delete_user(id):
    conn = get_db()
    conn.execute('DELETE FROM users WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return '', 204

# --- Orders Routes ---
@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db()
    orders = conn.execute('SELECT * FROM orders').fetchall()
    result = []
    for order in orders:
        o = dict(order)
        items = conn.execute('''
            SELECT oi.*, b.title as book_title 
            FROM order_items oi 
            LEFT JOIN books b ON oi.book_id = b.id 
            WHERE oi.order_id = ?
        ''', (o['id'],)).fetchall()
        o['items'] = [dict(i) for i in items]
        result.append(o)
    conn.close()
    return jsonify(result)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    user_id = data.get('user_id')
    items = data.get('items')
    
    if not user_id or not items:
        return jsonify({'error': 'Invalid data'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    total = 0
    for item in items:
        book = conn.execute('SELECT * FROM books WHERE id = ?', (item['book_id'],)).fetchone()
        if not book or book['stock'] < item['quantity']:
            conn.close()
            return jsonify({'error': f"Not enough stock for book {item['book_id']}"}), 400
        total += book['price'] * item['quantity']
        
    cursor.execute('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', (user_id, total))
    order_id = cursor.lastrowid
    
    for item in items:
        book = conn.execute('SELECT * FROM books WHERE id = ?', (item['book_id'],)).fetchone()
        cursor.execute(
            'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)',
            (order_id, item['book_id'], item['quantity'], book['price'])
        )
        cursor.execute('UPDATE books SET stock = stock - ? WHERE id = ?', (item['quantity'], item['book_id']))
        
    conn.commit()
    conn.close()
    return jsonify({'id': order_id, 'status': 'pending', 'total_amount': total}), 201

# --- Admin Login ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    password = request.json.get('password')
    if password == ADMIN_PASSWORD:
        return jsonify({'token': ADMIN_PASSWORD})
    return jsonify({'error': 'Invalid password'}), 401

# Analytics Routes
@app.route('/api/analytics/session', methods=['POST'])
def track_session():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, device_type, browser, os, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (data.get('user_id'), data.get('session_id'), request.remote_addr, request.headers.get('User-Agent'), data.get('device_type'), data.get('browser'), data.get('os'), data.get('country'))
    )
    conn.commit()
    session_id = cursor.lastrowid
    session = conn.execute('SELECT * FROM user_sessions WHERE id = ?', (session_id,)).fetchone()
    conn.close()
    return jsonify(dict(session)), 201

@app.route('/api/analytics/pageview', methods=['POST'])
def track_pageview():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO page_views (session_id, user_id, page_url, page_title, referrer, time_spent) VALUES (?, ?, ?, ?, ?, ?)',
        (data.get('session_id'), data.get('user_id'), data.get('page_url'), data.get('page_title'), data.get('referrer'), data.get('time_spent', 0))
    )
    conn.commit()
    view_id = cursor.lastrowid
    view = conn.execute('SELECT * FROM page_views WHERE id = ?', (view_id,)).fetchone()
    conn.close()
    return jsonify(dict(view)), 201

@app.route('/api/analytics/bookview', methods=['POST'])
def track_bookview():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO book_views (book_id, user_id, session_id, pages_read, time_spent, completed) VALUES (?, ?, ?, ?, ?, ?)',
        (data.get('book_id'), data.get('user_id'), data.get('session_id'), data.get('pages_read', 0), data.get('time_spent', 0), 1 if data.get('completed') else 0)
    )
    conn.commit()
    view_id = cursor.lastrowid
    view = conn.execute('SELECT * FROM book_views WHERE id = ?', (view_id,)).fetchone()
    conn.close()
    return jsonify(dict(view)), 201

@app.route('/api/analytics/dashboard', methods=['GET'])
@requires_admin
def get_analytics_dashboard():
    conn = get_db()
    
    total_users = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
    total_books = conn.execute('SELECT COUNT(*) as count FROM books').fetchone()['count']
    total_orders = conn.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
    total_sessions = conn.execute('SELECT COUNT(*) as count FROM user_sessions').fetchone()['count']
    
    # Active sessions (last 30 minutes)
    active_sessions = conn.execute("SELECT COUNT(*) as count FROM user_sessions WHERE datetime(started_at) >= datetime('now', '-30 minutes') AND is_active = 1").fetchone()['count']
    
    # Most viewed books
    popular_books = conn.execute("""
        SELECT b.id, b.title, b.cover, COUNT(bv.id) as views
        FROM books b
        LEFT JOIN book_views bv ON b.id = bv.book_id
        GROUP BY b.id
        ORDER BY views DESC
        LIMIT 10
    """).fetchall()
    
    # Device stats
    device_stats = conn.execute("""
        SELECT device_type as device, COUNT(*) as count
        FROM user_sessions
        GROUP BY device_type
    """).fetchall()
    
    # Recent sessions
    recent_sessions = conn.execute("""
        SELECT * FROM user_sessions
        ORDER BY started_at DESC
        LIMIT 20
    """).fetchall()
    
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_books': total_books,
        'total_orders': total_orders,
        'total_sessions': total_sessions,
        'active_sessions': active_sessions,
        'popular_books': [dict(b) for b in popular_books],
        'device_stats': [dict(d) for d in device_stats],
        'recent_sessions': [dict(s) for s in recent_sessions]
    })

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PYTHON_PORT', 5000))
    print(f"🐍 Python Flask server is running on http://localhost:{port}")
    app.run(port=port, debug=True)
