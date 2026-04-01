from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    # --- Health ---
    path('health/', views.health_check),

    # --- Admin auth ---
    path('admin/login/', views.admin_login),

    # --- Books: explicit paths BEFORE router (avoid pk-catch-all conflict) ---
    path('books/import/search/', views.import_search),
    path('books/import/do/', views.import_do),
    path('books/<int:pk>/pdf/', views.book_pdf),
    path('books/<int:pk>/content/', views.book_content),

    # --- Users ---
    path('users/', views.get_users),
    path('users/create/', views.create_user),
    path('users/<int:pk>/', views.user_detail),

    # --- Analytics ---
    path('analytics/session/', views.track_session),
    path('analytics/pageview/', views.track_pageview),
    path('analytics/bookview/', views.track_bookview),
    path('analytics/user/<int:pk>/', views.analytics_user),
    path('analytics/dashboard/', views.analytics_dashboard),

    # --- Site settings ---
    path('settings/', views.site_settings),

    # --- AI ---
    path('ai/summary/', views.ai_summary),
    path('ai/chat/', views.ai_chat),
    path('ai/recommend/', views.ai_recommend),
    path('ai/search/', views.ai_search),

    # --- Router (books list/detail, categories, orders) LAST ---
    path('', include(router.urls)),
]
