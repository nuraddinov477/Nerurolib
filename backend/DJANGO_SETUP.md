# 🚀 Django Backend O'rnatish va Ishga Tushirish

## 📋 Talablar

- Python 3.8+
- pip
- virtualenv (tavsiya etiladi)

---

## 🔧 O'rnatish bosqichlari

### 1. Virtual muhitni yaratish va faollashtirish

```bash
# Windows
cd backend
python -m venv venv
venv\Scripts\activate

# Linux/Mac
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Kerakli kutubxonalarni o'rnatish

```bash
pip install -r requirements.txt
```

### 3. Ma'lumotlar bazasini yaratish (Migration)

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Superuser yaratish (Admin panel uchun)

```bash
python manage.py createsuperuser
```

Sizdan so'raladi:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123` (yoki boshqa)

### 5. Static fayllarni to'plash

```bash
python manage.py collectstatic --noinput
```

### 6. Serverni ishga tushirish

```bash
python manage.py runserver 8000
```

Yoki Flask kabi 5000 portda:

```bash
python manage.py runserver 5000
```

---

## 🌐 API Endpoints

### Base URL: `http://localhost:8000/api/`

#### **Books (Kitoblar)**
- `GET /api/books/` - Barcha kitoblar
- `GET /api/books/{id}/` - Bitta kitob
- `GET /api/books/{id}/pdf/` - Kitob PDF fayli
- `POST /api/books/` - Yangi kitob (Admin)
- `PUT /api/books/{id}/` - Kitobni yangilash (Admin)
- `DELETE /api/books/{id}/` - Kitobni o'chirish (Admin)

#### **Categories (Kategoriyalar)**
- `GET /api/categories/` - Barcha kategoriyalar
- `POST /api/categories/` - Yangi kategoriya (Admin)
- `DELETE /api/categories/{id}/` - Kategoriyani o'chirish (Admin)

#### **Orders (Buyurtmalar)**
- `GET /api/orders/` - Barcha buyurtmalar
- `POST /api/orders/` - Yangi buyurtma

#### **Users (Foydalanuvchilar)**
- `GET /api/users/` - Barcha foydalanuvchilar
- `POST /api/users/create/` - Yangi user (Admin)
- `DELETE /api/users/{id}/` - Userni o'chirish (Admin)

#### **Auth**
- `POST /api/admin/login/` - Admin login

#### **Analytics**
- `POST /api/analytics/session/` - Session tracking
- `POST /api/analytics/pageview/` - Page view tracking
- `POST /api/analytics/bookview/` - Book view tracking
- `GET /api/analytics/dashboard/` - Analytics dashboard (Admin)

---

## 🔐 Admin Panel

Admin panelga kirish: `http://localhost:8000/admin/`

- Username: Siz yaratgan superuser
- Password: Siz belgilagan parol

Admin panelda quyidagilarni boshqarish mumkin:
- ✅ Kitoblar
- ✅ Kategoriyalar
- ✅ Buyurtmalar
- ✅ Foydalanuvchilar
- ✅ Analytics (Sessions, PageViews, BookViews)

---

## 📁 Loyiha tuzilmasi

```
backend/
├── bookstore/              # Asosiy Django loyiha
│   ├── settings.py         # Sozlamalar
│   ├── urls.py             # URL routing
│   ├── wsgi.py             # WSGI config
│   └── asgi.py             # ASGI config
├── books/                  # Books app
│   ├── models.py           # Ma'lumotlar modellari
│   ├── views.py            # API views
│   ├── serializers.py      # DRF serializers
│   ├── urls.py             # App URLs
│   ├── admin.py            # Admin panel
│   └── migrations/         # DB migrations
├── media/                  # Yuklangan fayllar (PDFs)
├── staticfiles/            # Static fayllar
├── db.sqlite3              # SQLite database
├── manage.py               # Django management
└── requirements.txt        # Python dependencies
```

---

## 🎨 Frontend bilan integratsiya

### React kodni yangilash kerak:

1. **API Base URL o'zgartirish:**

`src/context/DataContext.js` yoki tegishli faylda:

```javascript
const API_URL = 'http://localhost:8000/api';  // Flask emas, Django
```

2. **Axios konfiguratsiya:**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

3. **Admin token:**

Admin endpoint'larga murojaat qilganda:

```javascript
headers: {
  'x-admin-token': 'admin123',  // settings.ADMIN_PASSWORD
}
```

---

## 🔄 Eski ma'lumotlarni ko'chirish (SQLite → Django)

Agar eski `books.db` faylingiz bo'lsa, uni Django'ga import qilish:

```bash
# Eski ma'lumotlarni export qilish
sqlite3 books.db ".dump books" > books_export.sql

# Yangi Django DB'ga import qilish
python manage.py dbshell < books_export.sql
```

Yoki Python script orqali:

```python
# import_old_data.py
import sqlite3
from books.models import Book, Category

old_db = sqlite3.connect('../books.db')
cursor = old_db.cursor()

# Kategoriyalarni import qilish
cursor.execute("SELECT * FROM categories")
for row in cursor.fetchall():
    Category.objects.get_or_create(id=row[0], name=row[1])

# Kitoblarni import qilish
cursor.execute("SELECT * FROM books")
for row in cursor.fetchall():
    Book.objects.create(
        id=row[0],
        title=row[1],
        author=row[2],
        category=row[3],
        price=row[4],
        cover=row[5],
        description=row[6],
        stock=row[7],
        rating=row[8],
    )

old_db.close()
```

---

## ⚙️ Environment Variables (.env)

Ishlab chiqarish (production) muhitida:

```bash
# .env
SECRET_KEY=your-very-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@localhost/dbname
ADMIN_PASSWORD=your-strong-admin-password
```

---

## 🚀 Production'ga deploy

### Gunicorn bilan:

```bash
pip install gunicorn
gunicorn bookstore.wsgi:application --bind 0.0.0.0:8000
```

### Nginx + Gunicorn (Linux):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/backend/staticfiles/;
    }

    location /media/ {
        alias /path/to/backend/media/;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
}
```

---

## 🐛 Troubleshooting

### 1. CORS xatolari:

`settings.py`da tekshiring:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### 2. Static fayllar yuklanmayapti:

```bash
python manage.py collectstatic --clear
```

### 3. Migration xatolari:

```bash
python manage.py makemigrations --empty books
python manage.py migrate --fake
```

---

## ✅ Django vs Flask farqlari

| Feature | Flask (main.py) | Django (backend/) |
|---------|----------------|-------------------|
| Framework | Minimal | Full-featured |
| ORM | Yo'q (qo'lda SQL) | Django ORM |
| Admin Panel | Yo'q | ✅ Bor |
| Authentication | Qo'lda | Built-in |
| Forms | Qo'lda | Django Forms |
| Migrations | Qo'lda | Avtomatik |
| Testing | Minimal | Full support |
| Security | Qo'lda | Built-in |

---

## 📚 Qo'shimcha resurslar

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)

---

✨ **Django backend tayyor!** Frontend'ni `npm start` bilan ishga tushiring va backend Django serveri bilan bog'lang.
