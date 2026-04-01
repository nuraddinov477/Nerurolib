# Node.js Backend Integratsiyasi

## 📦 O'rnatilgan Paketlar

Backend uchun quyidagi paketlar o'rnatildi:

- **express** - Web server framework
- **cors** - Cross-Origin Resource Sharing
- **sqlite3** - SQLite database driver
- **sqlite** - Promise-based SQLite wrapper
- **multer** - File upload middleware

## 🚀 Serverni Ishga Tushirish

### 1. Faqat Node.js Backend
```bash
npm run server
```
Server `http://localhost:3001` da ishga tushadi.

### 2. Development rejimida (auto-restart)
```bash
npm run server:dev
```

### 3. React Frontend
```bash
npm run dev
# yoki
npm start
```
Frontend `http://localhost:3000` da ishga tushadi.

### 4. Ikkalasini bir vaqtda ishga tushirish
```bash
npm run both
```

## 📡 API Endpoints

### Books (Kitoblar)
- `GET /api/books` - Barcha kitoblarni olish
- `GET /api/books/:id` - Bitta kitobni olish
- `POST /api/books` - Yangi kitob qo'shish (Admin)
- `PUT /api/books/:id` - Kitobni yangilash (Admin)
- `DELETE /api/books/:id` - Kitobni o'chirish (Admin)
- `GET /api/books/:id/pdf` - PDF faylni yuklab olish

### Categories (Kategoriyalar)
- `GET /api/categories` - Barcha kategoriyalarni olish
- `POST /api/categories` - Yangi kategoriya qo'shish (Admin)
- `DELETE /api/categories/:id` - Kategoriyani o'chirish (Admin)

### Users (Foydalanuvchilar)
- `GET /api/users` - Barcha foydalanuvchilarni olish
- `GET /api/users/:id` - Bitta foydalanuvchini olish
- `POST /api/users` - Yangi foydalanuvchi yaratish (Admin)
- `PUT /api/users/:id` - Foydalanuvchini yangilash (Admin)
- `DELETE /api/users/:id` - Foydalanuvchini o'chirish (Admin)

### Orders (Buyurtmalar)
- `GET /api/orders` - Barcha buyurtmalarni olish
- `GET /api/orders/:id` - Bitta buyurtmani olish
- `POST /api/orders` - Yangi buyurtma yaratish
- `PUT /api/orders/:id` - Buyurtmani yangilash
- `DELETE /api/orders/:id` - Buyurtmani o'chirish

### Analytics (Analitika)
- `POST /api/analytics/session` - Session tracking
- `POST /api/analytics/pageview` - Page view tracking
- `POST /api/analytics/bookview` - Book view tracking
- `GET /api/analytics/dashboard` - Dashboard ma'lumotlari (Admin)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/health` - Server health check

## 🔐 Admin Autentifikatsiya

Admin endpoint'lariga kirish uchun header'da token yuborish kerak:

```javascript
headers: {
  'X-Admin-Token': 'admin123'
}
```

Yoki query parameter sifatida:
```
/api/books?admin_token=admin123
```

## 💾 Ma'lumotlar Bazasi

SQLite ma'lumotlar bazasi `books.db` faylida saqlanadi. Birinchi ishga tushirishda avtomatik yaratiladi va namuna ma'lumotlar bilan to'ldiriladi.

### Jadvallar:
- `users` - Foydalanuvchilar
- `books` - Kitoblar (PDF fayl bilan)
- `categories` - Kategoriyalar
- `orders` - Buyurtmalar
- `order_items` - Buyurtma elementlari
- `user_sessions` - Foydalanuvchi sessiyalari
- `page_views` - Sahifa ko'rishlari
- `book_views` - Kitob ko'rishlari

## 🔄 Frontend bilan Integratsiya

Frontend'da API'ni ishlatish uchun `src/context/DataContext.js` faylida API URL'ni o'zgartiring:

```javascript
const API_URL = 'http://localhost:3001/api';
```

## 📝 Namuna Ma'lumotlar

Birinchi ishga tushirishda quyidagi ma'lumotlar avtomatik qo'shiladi:

**Admin foydalanuvchi:**
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123`

**Kategoriyalar:**
- Fiction
- Non-Fiction
- Science
- History
- Biography

**Kitoblar:**
- The Great Gatsby
- To Kill a Mockingbird
- Sapiens

## 🛠️ Xatoliklarni Bartaraf Qilish

### Port band bo'lsa:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Ma'lumotlar bazasini qayta yaratish:
```bash
# books.db faylini o'chiring va serverni qayta ishga tushiring
del books.db
npm run server
```

## 📚 Qo'shimcha Ma'lumot

- Express.js: https://expressjs.com/
- SQLite: https://www.sqlite.org/
- Node.js: https://nodejs.org/

## 🎯 Keyingi Qadamlar

1. ✅ Node.js backend yaratildi
2. ✅ SQLite ma'lumotlar bazasi sozlandi
3. ✅ Barcha API endpoint'lar yaratildi
4. 🔄 Frontend'ni Node.js backend bilan bog'lash
5. 🔄 Production uchun deploy qilish

---

**Muallif:** Cline AI Assistant
**Sana:** 2026-02-17
