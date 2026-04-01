from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name='Nomi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')

    class Meta:
        verbose_name = 'Kategoriya'
        verbose_name_plural = 'Kategoriyalar'
        ordering = ['name']

    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(max_length=500, verbose_name='Sarlavha')
    author = models.CharField(max_length=300, verbose_name='Muallif')
    category = models.CharField(max_length=200, default='Other', verbose_name='Kategoriya')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Narxi')
    cover = models.CharField(max_length=10, default='📕', verbose_name='Muqova emoji')
    description = models.TextField(blank=True, verbose_name='Tavsif')
    stock = models.IntegerField(default=0, verbose_name='Omborda')
    rating = models.FloatField(default=0, verbose_name='Reyting')
    pdf_file = models.FileField(upload_to='books/pdfs/', null=True, blank=True, verbose_name='PDF fayl')
    pdf_url = models.TextField(null=True, blank=True, verbose_name='PDF URL (tashqi)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan')

    class Meta:
        verbose_name = 'Kitob'
        verbose_name_plural = 'Kitoblar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.author}"

    @property
    def has_pdf(self):
        return bool(self.pdf_file) or bool(self.pdf_url)

    @property
    def external_url(self):
        return self.pdf_url or None


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('confirmed', 'Tasdiqlangan'),
        ('delivered', 'Yetkazilgan'),
        ('cancelled', 'Bekor qilingan'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Foydalanuvchi')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Jami summa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Holat')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan')

    class Meta:
        verbose_name = 'Buyurtma'
        verbose_name_plural = 'Buyurtmalar'
        ordering = ['-created_at']

    def __str__(self):
        return f"Buyurtma #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='Buyurtma')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name='Kitob')
    quantity = models.IntegerField(default=1, verbose_name='Miqdor')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Narx')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')

    class Meta:
        verbose_name = 'Buyurtma elementi'
        verbose_name_plural = 'Buyurtma elementlari'

    def __str__(self):
        return f"{self.book.title} x {self.quantity}"


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sessions')
    session_id = models.CharField(max_length=200, verbose_name='Sessiya ID')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP manzil')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    device_type = models.CharField(max_length=100, blank=True, verbose_name='Qurilma turi')
    browser = models.CharField(max_length=100, blank=True, verbose_name='Brauzer')
    os = models.CharField(max_length=100, blank=True, verbose_name='Operatsion tizim')
    country = models.CharField(max_length=100, blank=True, verbose_name='Mamlakat')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Boshlangan')
    ended_at = models.DateTimeField(null=True, blank=True, verbose_name='Tugagan')
    is_active = models.BooleanField(default=True, verbose_name='Faol')

    class Meta:
        verbose_name = 'Foydalanuvchi sessiyasi'
        verbose_name_plural = 'Foydalanuvchi sessiyalari'
        ordering = ['-started_at']

    def __str__(self):
        return f"Session {self.session_id[:8]}..."


class PageView(models.Model):
    session_id = models.CharField(max_length=200, verbose_name='Sessiya ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    page_url = models.CharField(max_length=500, verbose_name='Sahifa URL')
    page_title = models.CharField(max_length=300, blank=True, verbose_name='Sahifa sarlavhasi')
    referrer = models.CharField(max_length=500, blank=True, verbose_name='Referrer')
    time_spent = models.IntegerField(default=0, verbose_name="O'tkazilgan vaqt (soniya)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')

    class Meta:
        verbose_name = "Sahifa ko'rish"
        verbose_name_plural = "Sahifa ko'rishlar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.page_url} - {self.created_at}"


class BookView(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=200, verbose_name='Sessiya ID')
    pages_read = models.IntegerField(default=0, verbose_name="O'qilgan sahifalar")
    time_spent = models.IntegerField(default=0, verbose_name="O'tkazilgan vaqt (soniya)")
    completed = models.BooleanField(default=False, verbose_name='Tugallangan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan')

    class Meta:
        verbose_name = "Kitob ko'rish"
        verbose_name_plural = "Kitob ko'rishlar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.book.title} - {self.created_at}"


class SiteSettings(models.Model):
    key = models.CharField(max_length=200, primary_key=True, verbose_name='Kalit')
    value = models.TextField(verbose_name='Qiymat')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan')

    class Meta:
        verbose_name = 'Sayt sozlamasi'
        verbose_name_plural = 'Sayt sozlamalari'

    def __str__(self):
        return self.key
