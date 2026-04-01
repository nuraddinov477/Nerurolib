# 🔄 Flask → Django Migration Guide

## Nima o'zgardi?

### 📁 Loyiha tuzilmasi

**ESKI (Flask):**
```
mir-knig/
├── main.py              # Flask backend
├── books.db             # SQLite database
├── src/                 # React frontend
└── public/
```

**YANGI (Django):**
```
mir-knig/
├── backend/             # 🆕 Django backend
│   ├── bookstore/       # Django project
│   ├── books/           # Django app
│   ├── manage.py
│   └── db.sqlite3
├── src/                 # React frontend (o'zgarishlar minimal)
└── public/
```

---

## 🚀 Qadamma-qadam migratsiya

### 1️⃣ Backend'ni o'rnatish

```bash
# Virtual environment yaratish
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Paketlarni o'rnatish
pip install -r requirements.txt

# Database yaratish
python manage.py makemigrations
python manage.py migrate

# Superuser yaratish
python manage.py createsuperuser
# Username: admin
# Password: admin123

# Serverni ishga tushirish
python manage.py runserver 5000
```

✅ Backend tayyor: `http://localhost:5000`

---

### 2️⃣ Frontend'ni yangilash

**API URL'ni o'zgartirish kerak FAQAT:**

Hozirda kodda:
```javascript
const res = await fetch(`http://localhost:5000/api/books/${book.id}/pdf`);
```

Django bilan bir xil ishlaydi, chunki biz 5000 portda ishga tushirdik! ✅

Agar 8000 portda ishlatmoqchi bo'lsangiz:
```javascript
const API_BASE = 'http://localhost:8000/api';
```

---

### 3️⃣ Eski ma'lumotlarni ko'chirish (Optional)

Agar `books.db` da ma'lumotlaringiz bo'lsa:

**Variant 1: Django Admin orqali qo'lda**
1. `http://localhost:5000/admin/` ga kiring
2. Kitoblarni qo'lda qo'shing

**Variant 2: Python script**

`backend/import_data.py` yarating:

```python
import os
import django
import sqlite3

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore.settings')
django.setup()

from books.models import Book, Category

# Eski DB'dan o'qish
old_db = sqlite3.connect('../../books.db')
cursor = old_db.cursor()

# Kategoriyalar
cursor.execute("SELECT DISTINCT category FROM books")
for row in cursor.fetchall():
    Category.objects.get_or_create(name=row[0])

# Kitoblar
cursor.execute("SELECT * FROM books")
for row in cursor.fetchall():
    Book.objects.create(
        title=row[1],
        author=row[2],
        category=row[3],
        price=row[4] or 0,
        cover=row[5] or '📕',
        description=row[6] or '',
        stock=row[7] or 0,
        rating=row[8] or 0,
    )

old_db.close()
print("✅ Ma'lumotlar ko'chirildi!")
```

Ishga tushirish:
```bash
cd backend
python import_data.py
```

---

## 🎯 API Endpointlar taqqoslash

### Flask vs Django

| Endpoint | Flask (main.py) | Django (backend/) |
|----------|-----------------|-------------------|
| Books list | `GET /api/books` | `GET /api/books/` |
| Single book | `GET /api/books/<id>` | `GET /api/books/{id}/` |
| Book PDF | `GET /api/books/<id>/pdf` | `GET /api/books/{id}/pdf/` |
| Categories | `GET /api/categories` | `GET /api/categories/` |
| Create book | `POST /api/books` | `POST /api/books/` |
| Admin login | `POST /api/admin/login` | `POST /api/admin/login/` |

**Farq:** Django URL'larda oxirida `/` bor!

---

## ✅ Django ustunliklari

### 1. **Admin Panel** 🎨
Flask'da yo'q, Django'da bor!

```
http://localhost:5000/admin/
```

Imkoniyatlar:
- ✅ Kitoblarni qo'shish/tahrirlash/o'chirish
- ✅ Kategoriyalarni boshqarish
- ✅ Buyurtmalarni ko'rish
- ✅ Foydalanuvchilarni boshqarish
- ✅ Analytics (qaysi kitob ko'p o'qilgan, sessiyalar)

### 2. **ORM (Object-Relational Mapping)** 🗄️

**Flask (qo'lda SQL):**
```python
cursor.execute('SELECT * FROM books WHERE id = ?', (id,))
book = cursor.fetchone()
```

**Django (ORM):**
```python
book = Book.objects.get(id=id)
```

### 3. **Migration** 🔄

**Flask:** Qo'lda CREATE TABLE

**Django:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. **Security** 🔐

- ✅ CSRF protection (avtomatik)
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Clickjacking protection
- ✅ Password hashing (automatic)

### 5. **Testing** 🧪

Django test framework built-in:

```python
from django.test import TestCase
from books.models import Book

class BookTestCase(TestCase):
    def test_create_book(self):
        book = Book.objects.create(
            title="Test Book",
            author="Test Author"
        )
        self.assertEqual(book.title, "Test Book")
```

### 6. **Authentication** 👤

Django'da built-in:
- User model
- Login/Logout
- Permissions
- Groups

Flask'da qo'lda yozish kerak.

---

## 📊 Performance Comparison

| Metric | Flask | Django |
|--------|-------|--------|
| Setup time | 5 min | 15 min |
| Code lines (backend) | ~500 | ~300 (ORM tufayli) |
| Features | Manual | Built-in |
| Scaling | Manual | Better |
| Admin panel | ❌ | ✅ |

---

## 🔧 Development Workflow

### Flask (eski):
```bash
python main.py  # Backend
npm start       # Frontend (boshqa terminal)
```

### Django (yangi):
```bash
cd backend
python manage.py runserver 5000  # Backend

# Boshqa terminal
npm start  # Frontend
```

---

## 🌐 Production Deployment

### Flask:
```bash
gunicorn main:app
```

### Django:
```bash
gunicorn bookstore.wsgi:application
# yoki
daphne bookstore.asgi:application  # async
```

---

## 🆘 Muammolar va yechimlar

### 1. **CORS xatosi**

**Sabab:** Django'da CORS sozlanmagan

**Yechim:**
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### 2. **404 - API topilmayapti**

**Sabab:** URL oxirida `/` yo'q

**Yechim:**
```javascript
// NOTO'G'RI
fetch('http://localhost:5000/api/books')

// TO'G'RI
fetch('http://localhost:5000/api/books/')
```

### 3. **Static fayllar yuklanmayapti**

**Yechim:**
```bash
python manage.py collectstatic
```

### 4. **Admin panel ochilmayapti**

**Yechim:**
```bash
python manage.py createsuperuser
```

---

## 📋 Checklist - Migratsiya tugallanganmi?

- [ ] Django backend o'rnatildi
- [ ] `pip install -r requirements.txt` ishladi
- [ ] `python manage.py migrate` ishladi
- [ ] Superuser yaratildi
- [ ] Server ishga tushdi (`runserver 5000`)
- [ ] Admin panel ochildi (`/admin/`)
- [ ] Frontend'dan API ga ulanish ishlayapti
- [ ] Eski ma'lumotlar ko'chirildi (agar kerak bo'lsa)
- [ ] CORS muammosi yo'q

---

## 🎓 Django o'rganish resurslari

1. **Rasmiy documentation:** https://docs.djangoproject.com/
2. **Django REST Framework:** https://www.django-rest-framework.org/
3. **Django Tutorial (video):** https://www.youtube.com/watch?v=F5mRW0jo-U4
4. **Django O'zbek tilida:** https://t.me/python_uz

---

## ❓ Tez-tez so'raladigan savollar

**Q: Flask serverini o'chirsam bo'ladimi?**
A: Ha! Django to'liq ishlasa, `main.py` kerak emas.

**Q: React kodini ko'p o'zgartirishim kerakmi?**
A: Yo'q, minimal. Faqat API URL.

**Q: Django sekinroqmi?**
A: Yo'q, tez. ORM optimizatsiya qilgan.

**Q: Admin panel xavfli emasmi?**
A: Xavfsiz, agar strong password ishlatsa.

**Q: Production'ga qanday deploy qilaman?**
A: Heroku, DigitalOcean, AWS, yoki VPS.

---

✨ **Django'ga muvaffaqiyatli o'tdingiz!** 🎉

Agar savollar bo'lsa:
- 📧 Email: support@mirknig.uz
- 💬 Telegram: @mirknig_support
