# 📚 Mir Knig - Django Backend

Modern kitob do'koni web ilovasi - Django REST Framework bilan qurilgan professional backend.

## ✨ Xususiyatlar

### 🎯 Backend (Django)
- ✅ Django REST Framework API
- ✅ SQLite database (PostgreSQL'ga o'tkazish oson)
- ✅ Admin panel (kitoblar, buyurtmalar, analytics)
- ✅ JWT Authentication (optional)
- ✅ CORS configured
- ✅ File upload (PDF books)
- ✅ Analytics tracking
- ✅ API documentation

### 🎨 Frontend (React)
- ✅ Modern UI/UX
- ✅ Dark/Light theme
- ✅ Live search
- ✅ Favorites (Wishlist)
- ✅ Reading history
- ✅ Toast notifications
- ✅ Mobile responsive
- ✅ Smooth animations

---

## 🚀 Tezkor Boshlash

### Variant 1: Avtomatik (Recommended)

**Windows:**
```bash
cd backend
start_django.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x start_django.sh
./start_django.sh
```

### Variant 2: Qo'lda

```bash
cd backend

# Virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Dependencies
pip install -r requirements.txt

# Database
python manage.py makemigrations
python manage.py migrate

# Superuser
python manage.py createsuperuser

# Run server
python manage.py runserver 5000
```

---

## 📁 Loyiha Tuzilmasi

```
mir-knig/
├── backend/                    # Django backend
│   ├── bookstore/              # Project settings
│   │   ├── settings.py         # Configuration
│   │   ├── urls.py             # Main URL routing
│   │   └── wsgi.py             # WSGI config
│   ├── books/                  # Books app
│   │   ├── models.py           # Database models
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── urls.py             # App URLs
│   │   └── admin.py            # Admin configuration
│   ├── media/                  # Uploaded files
│   ├── manage.py               # Django management
│   └── requirements.txt        # Python dependencies
│
├── src/                        # React frontend
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── styles/
│
├── public/
└── package.json
```

---

## 🌐 API Endpoints

### Base URL: `http://localhost:5000/api/`

### 📖 Books
```
GET    /api/books/              # Barcha kitoblar
GET    /api/books/{id}/         # Bitta kitob
GET    /api/books/{id}/pdf/     # PDF fayl
POST   /api/books/              # Yangi kitob (Admin)
PUT    /api/books/{id}/         # Yangilash (Admin)
DELETE /api/books/{id}/         # O'chirish (Admin)
```

### 🏷️ Categories
```
GET    /api/categories/         # Barcha kategoriyalar
POST   /api/categories/         # Yangi kategoriya (Admin)
DELETE /api/categories/{id}/    # O'chirish (Admin)
```

### 🛒 Orders
```
GET    /api/orders/             # Barcha buyurtmalar
POST   /api/orders/             # Yangi buyurtma
```

### 👥 Users
```
GET    /api/users/              # Barcha foydalanuvchilar
POST   /api/users/create/       # Yangi user (Admin)
DELETE /api/users/{id}/         # O'chirish (Admin)
```

### 🔐 Auth
```
POST   /api/admin/login/        # Admin login
```

### 📊 Analytics
```
POST   /api/analytics/session/     # Session tracking
POST   /api/analytics/pageview/    # Page view tracking
POST   /api/analytics/bookview/    # Book view tracking
GET    /api/analytics/dashboard/   # Dashboard (Admin)
```

---

## 🎨 Admin Panel

URL: `http://localhost:5000/admin/`

**Imkoniyatlar:**
- ✅ Kitoblarni boshqarish (CRUD)
- ✅ Kategoriyalarni boshqarish
- ✅ Buyurtmalarni ko'rish
- ✅ Foydalanuvchilarni boshqarish
- ✅ Analytics va statistika
- ✅ Media fayllar (PDF)

**Superuser yaratish:**
```bash
python manage.py createsuperuser
```

---

## 🔧 Sozlamalar

### Database

**SQLite (default):**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**PostgreSQL ga o'tish:**
```bash
pip install psycopg2-binary
```

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mirknig_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### CORS

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://yourdomain.com",
]
```

### Static & Media Files

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## 🧪 Testing

```bash
# Run tests
python manage.py test

# Run specific test
python manage.py test books.tests.BookTestCase

# Coverage
pip install coverage
coverage run manage.py test
coverage report
```

---

## 🚀 Production Deployment

### 1. Heroku

```bash
# Install Heroku CLI
heroku login
heroku create mirknig-app

# Add buildpack
heroku buildpacks:add heroku/python

# Deploy
git push heroku main

# Migrate
heroku run python manage.py migrate

# Create superuser
heroku run python manage.py createsuperuser
```

### 2. DigitalOcean / VPS

```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Clone repo
git clone https://github.com/yourusername/mir-knig.git
cd mir-knig/backend

# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Migrate
python manage.py migrate
python manage.py collectstatic

# Run with Gunicorn
gunicorn bookstore.wsgi:application --bind 0.0.0.0:8000
```

**Nginx configuration:**
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

## 📊 Database Models

### Book
```python
- title: CharField
- author: CharField
- category: CharField
- price: DecimalField
- cover: CharField (emoji)
- description: TextField
- stock: IntegerField
- rating: FloatField
- pdf_file: FileField
```

### Order
```python
- user: ForeignKey(User)
- total_amount: DecimalField
- status: CharField (pending/confirmed/delivered/cancelled)
- items: ManyToMany(OrderItem)
```

### UserSession (Analytics)
```python
- session_id: CharField
- ip_address: GenericIPAddressField
- device_type: CharField
- browser: CharField
- is_active: BooleanField
```

---

## 🔐 Security

### Production Checklist:

- [ ] `DEBUG = False`
- [ ] Strong `SECRET_KEY`
- [ ] `ALLOWED_HOSTS` configured
- [ ] HTTPS enabled
- [ ] Database password strong
- [ ] Admin password strong
- [ ] CORS properly configured
- [ ] Static files served correctly
- [ ] Media files permissions set

### Environment Variables (.env)

```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@localhost/db
ADMIN_PASSWORD=strong-password
```

---

## 🐛 Troubleshooting

### 1. CORS errors
```python
# settings.py
CORS_ALLOW_ALL_ORIGINS = True  # Development only!
```

### 2. Static files not loading
```bash
python manage.py collectstatic --clear
```

### 3. Migration errors
```bash
python manage.py makemigrations --empty books
python manage.py migrate --fake
```

### 4. Admin CSS not loading
```bash
python manage.py collectstatic
# Make sure STATIC_ROOT is set
```

---

## 📚 Resources

- [Django Docs](https://docs.djangoproject.com/)
- [DRF Docs](https://www.django-rest-framework.org/)
- [Deployment Guide](https://docs.djangoproject.com/en/4.2/howto/deployment/)

---

## 👨‍💻 Development

### Install development dependencies

```bash
pip install -r requirements-dev.txt
```

```txt
# requirements-dev.txt
black
flake8
pylint
django-debug-toolbar
```

### Code formatting

```bash
black .
flake8 .
```

---

## 📝 License

MIT License - Free to use and modify

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📧 Support

- **Email:** support@mirknig.uz
- **Telegram:** @mirknig_support
- **GitHub Issues:** [Create Issue](https://github.com/yourusername/mir-knig/issues)

---

✨ **Django backend - Professional, Secure, Scalable!** 🚀
