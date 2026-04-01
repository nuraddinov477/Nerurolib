from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, Category, Order, OrderItem, UserSession, PageView, BookView, SiteSettings


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']


class BookSerializer(serializers.ModelSerializer):
    has_pdf = serializers.BooleanField(read_only=True)
    external_url = serializers.CharField(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'category', 'price', 'cover',
            'description', 'stock', 'rating', 'has_pdf', 'external_url',
            'pdf_url', 'created_at', 'updated_at',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Never expose raw pdf_file path — only has_pdf flag
        data.pop('pdf_url', None)
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'book', 'book_id', 'book_title', 'quantity', 'price', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user_id', 'total_amount', 'status', 'items', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='first_name', default='')
    is_admin = serializers.BooleanField(source='is_staff', read_only=True)
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'is_admin', 'created_at']


class UserSessionSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', allow_null=True, read_only=True)

    class Meta:
        model = UserSession
        fields = [
            'id', 'user_id', 'session_id', 'ip_address', 'user_agent',
            'device_type', 'browser', 'os', 'country',
            'started_at', 'ended_at', 'is_active',
        ]


class PageViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageView
        fields = ['id', 'session_id', 'user_id', 'page_url', 'page_title', 'referrer', 'time_spent', 'created_at']


class BookViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookView
        fields = ['id', 'book_id', 'user_id', 'session_id', 'pages_read', 'time_spent', 'completed', 'created_at']


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ['key', 'value', 'updated_at']
