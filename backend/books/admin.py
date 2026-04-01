from django.contrib import admin
from .models import Book, Category, Order, OrderItem, UserSession, PageView, BookView


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'price', 'stock', 'rating', 'has_pdf', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'author', 'description']
    list_editable = ['price', 'stock', 'rating']
    readonly_fields = ['created_at', 'updated_at']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['book', 'quantity', 'price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'ip_address', 'device_type', 'browser', 'is_active', 'started_at']
    list_filter = ['is_active', 'device_type', 'browser', 'started_at']
    search_fields = ['session_id', 'ip_address', 'user__username']
    readonly_fields = ['started_at']


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['page_url', 'user', 'session_id', 'time_spent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['page_url', 'session_id']
    readonly_fields = ['created_at']


@admin.register(BookView)
class BookViewAdmin(admin.ModelAdmin):
    list_display = ['book', 'user', 'pages_read', 'time_spent', 'completed', 'created_at']
    list_filter = ['completed', 'created_at']
    search_fields = ['book__title', 'session_id']
    readonly_fields = ['created_at']
