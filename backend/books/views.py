import os
import json
import secrets
import time
import requests as http_requests

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.db.models import Count
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Book, Category, Order, OrderItem, UserSession, PageView, BookView, SiteSettings
from .serializers import (
    BookSerializer, CategorySerializer, OrderSerializer,
    UserSerializer, UserSessionSerializer, PageViewSerializer,
    BookViewSerializer, SiteSettingsSerializer,
)

# ---------------------------------------------------------------------------
# In-memory admin token store  {token: expiry_timestamp}
# ---------------------------------------------------------------------------
_admin_tokens: dict[str, float] = {}
TOKEN_TTL = 12 * 60 * 60  # 12 hours


def _issue_token() -> str:
    token = secrets.token_hex(32)
    _admin_tokens[token] = time.time() + TOKEN_TTL
    return token


def _is_valid_token(token: str | None) -> bool:
    if not token:
        return False
    expiry = _admin_tokens.get(token)
    if expiry is None:
        return False
    if time.time() > expiry:
        del _admin_tokens[token]
        return False
    return True


def _get_token(request) -> str | None:
    t = request.headers.get('X-Admin-Token')
    if not t:
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            t = auth[7:]
    return t or None


def require_admin(fn):
    """Decorator — returns 401 unless a valid admin token is present."""
    def wrapper(request, *args, **kwargs):
        if not _is_valid_token(_get_token(request)):
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        return fn(request, *args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'message': 'Django REST API server is running'})


# ---------------------------------------------------------------------------
# Admin login
# ---------------------------------------------------------------------------

@api_view(['POST'])
def admin_login(request):
    password = request.data.get('password')
    if password == settings.ADMIN_PASSWORD:
        return Response({'token': _issue_token()})
    return Response({'error': 'Invalid password'}, status=401)


# ---------------------------------------------------------------------------
# Books
# ---------------------------------------------------------------------------

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]

    def list(self, request):
        books = Book.objects.all()
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=404)
        serializer = BookSerializer(book)
        data = serializer.data
        data['external_url'] = book.pdf_url or None
        return Response(data)

    def create(self, request):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        data = request.data
        if not data.get('title') or not data.get('author'):
            return Response({'error': 'Title and author are required'}, status=400)
        book = Book.objects.create(
            title=data['title'],
            author=data['author'],
            category=data.get('category', 'Other'),
            price=data.get('price', 0),
            cover=data.get('cover', '📕'),
            description=data.get('description', ''),
            stock=data.get('stock', 0),
            pdf_url=data.get('pdf_url') or None,
        )
        # Handle base64 PDF upload
        pdf_data = data.get('pdf_data')
        if pdf_data:
            import base64
            from django.core.files.base import ContentFile
            raw = pdf_data.split(',')[1] if ',' in pdf_data else pdf_data
            book.pdf_file.save(f"{book.id}.pdf", ContentFile(base64.b64decode(raw)), save=True)
        serializer = BookSerializer(book)
        return Response(serializer.data, status=201)

    def update(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=404)
        data = request.data
        for field in ['title', 'author', 'category', 'price', 'cover', 'description', 'stock']:
            if field in data:
                setattr(book, field, data[field])
        if 'pdf_url' in data:
            book.pdf_url = data['pdf_url'] or None
        pdf_data = data.get('pdf_data')
        if pdf_data:
            import base64
            from django.core.files.base import ContentFile
            raw = pdf_data.split(',')[1] if ',' in pdf_data else pdf_data
            book.pdf_file.save(f"{book.id}.pdf", ContentFile(base64.b64decode(raw)), save=False)
        book.save()
        return Response(BookSerializer(book).data)

    def destroy(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            Book.objects.get(pk=pk).delete()
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=404)
        return Response(status=204)


@api_view(['GET'])
def book_pdf(request, pk):
    """Serve stored PDF binary."""
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)
    if not book.pdf_file:
        return Response({'error': 'PDF not available for this book'}, status=404)
    return FileResponse(book.pdf_file.open('rb'), content_type='application/pdf',
                        filename=f"{book.title}.pdf")


@api_view(['GET'])
def book_content(request, pk):
    """Proxy-fetch Gutenberg HTML content and strip boilerplate."""
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Kontent mavjud emas'}, status=404)
    if not book.pdf_url:
        return Response({'error': 'Kontent mavjud emas'}, status=404)

    url = book.pdf_url
    # Only allow gutenberg.org and gutendex.com
    from urllib.parse import urlparse
    parsed = urlparse(url)
    allowed = {'www.gutenberg.org', 'gutenberg.org', 'gutendex.com', 'www.gutendex.com'}
    if parsed.scheme != 'https' or parsed.netloc not in allowed:
        return Response({'error': 'Ruxsat etilmagan URL'}, status=400)

    try:
        resp = http_requests.get(url, timeout=25, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; NeurolibBot/1.0)',
            'Accept': 'text/html,*/*',
        }, allow_redirects=True)
        resp.raise_for_status()
        final_url = resp.url
    except Exception as e:
        return Response({'error': f'Kontent yuklanmadi: {str(e)}'}, status=500)

    html = resp.text
    base_url = final_url[:final_url.rfind('/') + 1]

    import re
    body_match = re.search(r'<body[^>]*>([\s\S]*)</body>', html, re.IGNORECASE)
    body = body_match.group(1) if body_match else html

    body = re.sub(r'<script[\s\S]*?</script>', '', body, flags=re.IGNORECASE)
    body = re.sub(r'<nav[\s\S]*?</nav>', '', body, flags=re.IGNORECASE)
    body = re.sub(r'<header[\s\S]*?</header>', '', body, flags=re.IGNORECASE)
    body = re.sub(r'<footer[\s\S]*?</footer>', '', body, flags=re.IGNORECASE)
    body = re.sub(r'href="https?://[^"]+"', 'href="#"', body, flags=re.IGNORECASE)
    body = re.sub(r'href="(?!#)[^"]+"', 'href="#"', body, flags=re.IGNORECASE)
    body = re.sub(r'src="(?!https?://)(?!data:)([^"]+)"', f'src="{base_url}\\1"', body, flags=re.IGNORECASE)

    start = body.find('*** START OF THE PROJECT GUTENBERG EBOOK')
    if start != -1:
        after = body.find('***', start + 3)
        if after != -1:
            body = body[after + 3:].strip()

    body = re.sub(r'^(\s*</[a-zA-Z]+>\s*)+', '', body).strip()

    end = body.find('*** END OF THE PROJECT GUTENBERG EBOOK')
    if end != -1:
        body = body[:end].strip()

    body = re.sub(r'<section[^>]*pg-boilerplate[^>]*>[\s\S]*?</section>', '', body, flags=re.IGNORECASE)

    return Response({'content': body, 'title': book.title})


@api_view(['POST'])
def import_search(request):
    """Search Gutendex for books to import."""
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    query = request.data.get('query')
    if not query:
        return Response({'error': 'query talab qilinadi'}, status=400)
    limit = int(request.data.get('limit', 10))
    language = request.data.get('language', '')
    region = request.data.get('region', '')

    full_query = f"{query} {region}".strip() if region else query
    url = f"https://gutendex.com/books/?search={http_requests.utils.quote(full_query)}"
    if language:
        url += f"&languages={language}"

    try:
        resp = http_requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return Response({'error': f'Qidiruvda xato: {str(e)}'}, status=500)

    covers = ['📕', '📗', '📘', '📙', '📔', '📓', '📒', '📚']
    books = []
    for i, b in enumerate(data.get('results', [])[:limit]):
        fmts = b.get('formats', {})
        read_url = (fmts.get('text/html') or fmts.get('application/epub+zip') or
                    fmts.get('text/plain; charset=utf-8') or fmts.get('text/plain; charset=us-ascii'))
        if not read_url:
            continue
        books.append({
            'title': b['title'],
            'author': ', '.join(a['name'] for a in b.get('authors', [])) or "Noma'lum muallif",
            'category': (b.get('subjects', [''])[0].split(' -- ')[0][:40] if b.get('subjects') else 'Klassik'),
            'description': ', '.join(b.get('subjects', [])[:3]) or 'Jahon klassik adabiyoti',
            'pdf_url': read_url,
            'cover': covers[i % len(covers)],
            'cover_img': fmts.get('image/jpeg'),
            'gutenberg_id': b['id'],
            'languages': b.get('languages', []),
        })

    return Response({'books': books, 'total': data.get('count', 0), 'query': query})


@api_view(['POST'])
def import_do(request):
    """Bulk-import Gutenberg books into DB."""
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    books_data = request.data.get('books')
    if not books_data or not isinstance(books_data, list):
        return Response({'error': 'books array talab qilinadi'}, status=400)

    imported = []
    for b in books_data:
        book = Book.objects.create(
            title=b['title'],
            author=b.get('author', ''),
            category=b.get('category', 'Klassik'),
            price=0,
            cover=b.get('cover', '📕'),
            description=b.get('description', ''),
            stock=999,
            pdf_url=b.get('pdf_url'),
        )
        imported.append({'id': book.id, **b})

    return Response({'count': len(imported), 'books': imported})


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def create(self, request):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Category name is required'}, status=400)
        if Category.objects.filter(name=name).exists():
            return Response({'error': 'Category already exists'}, status=409)
        cat = Category.objects.create(name=name)
        return Response(CategorySerializer(cat).data, status=201)

    def destroy(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        # pk can be numeric id or category name
        if str(pk).isdigit():
            Category.objects.filter(pk=pk).delete()
        else:
            Category.objects.filter(name=pk).delete()
        return Response(status=204)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items__book')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def list(self, request):
        is_admin = _is_valid_token(_get_token(request))
        user_id = request.query_params.get('user_id')
        if is_admin:
            qs = Order.objects.filter(user_id=user_id) if user_id else Order.objects.all()
        else:
            if not user_id:
                return Response({'error': 'Unauthorized'}, status=401)
            qs = Order.objects.filter(user_id=user_id)
        return Response(OrderSerializer(qs.prefetch_related('items__book'), many=True).data)

    def retrieve(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            order = Order.objects.prefetch_related('items__book').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        return Response(OrderSerializer(order).data)

    def create(self, request):
        user_id = request.data.get('user_id')
        items_data = request.data.get('items', [])
        if not user_id or not items_data:
            return Response({'error': 'user_id and items are required'}, status=400)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        total = 0
        for item in items_data:
            try:
                book = Book.objects.get(pk=item['book_id'])
            except Book.DoesNotExist:
                return Response({'error': f"Book {item['book_id']} not found"}, status=404)
            if book.stock < item['quantity']:
                return Response({'error': f"Not enough stock for {book.title}"}, status=400)
            total += float(book.price) * item['quantity']

        order = Order.objects.create(user=user, total_amount=total)
        for item in items_data:
            book = Book.objects.get(pk=item['book_id'])
            from .models import OrderItem as OI
            OI.objects.create(order=order, book=book, quantity=item['quantity'], price=book.price)
            book.stock -= item['quantity']
            book.save()

        return Response(OrderSerializer(Order.objects.prefetch_related('items__book').get(pk=order.pk)).data, status=201)

    def partial_update(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        if 'status' in request.data:
            order.status = request.data['status']
            order.save()
        return Response(OrderSerializer(Order.objects.prefetch_related('items__book').get(pk=pk)).data)

    def update(self, request, pk=None):
        return self.partial_update(request, pk=pk)

    def destroy(self, request, pk=None):
        if not _is_valid_token(_get_token(request)):
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            order = Order.objects.prefetch_related('items__book').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        # Restore stock
        for item in order.items.all():
            item.book.stock += item.quantity
            item.book.save()
        order.delete()
        return Response(status=204)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@api_view(['GET'])
def get_users(request):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    return Response(UserSerializer(User.objects.all(), many=True).data)


@api_view(['GET', 'PUT', 'DELETE'])
def user_detail(request, pk):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)

    if request.method == 'PUT':
        if 'full_name' in request.data:
            user.first_name = request.data['full_name']
        if 'is_admin' in request.data:
            user.is_staff = bool(request.data['is_admin'])
        user.save()
        return Response(UserSerializer(user).data)

    if request.method == 'DELETE':
        user.delete()
        return Response(status=204)


@api_view(['POST'])
def create_user(request):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    data = request.data
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return Response({'error': 'Username, email, and password are required'}, status=400)
    try:
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            first_name=data.get('full_name', ''),
            is_staff=bool(data.get('is_admin', False)),
        )
        return Response(UserSerializer(user).data, status=201)
    except Exception:
        return Response({'error': 'Username or email already exists'}, status=409)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@api_view(['POST'])
def track_session(request):
    data = request.data
    session = UserSession.objects.create(
        user_id=data.get('user_id') or None,
        session_id=data.get('session_id', ''),
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        device_type=data.get('device_type', ''),
        browser=data.get('browser', ''),
        os=data.get('os', ''),
        country=data.get('country', ''),
    )
    return Response(UserSessionSerializer(session).data, status=201)


@api_view(['POST'])
def track_pageview(request):
    data = request.data
    pv = PageView.objects.create(
        session_id=data.get('session_id', ''),
        user_id=data.get('user_id') or None,
        page_url=data.get('page_url', ''),
        page_title=data.get('page_title', ''),
        referrer=data.get('referrer', ''),
        time_spent=data.get('time_spent', 0),
    )
    return Response(PageViewSerializer(pv).data, status=201)


@api_view(['POST'])
def track_bookview(request):
    data = request.data
    bv = BookView.objects.create(
        book_id=data.get('book_id'),
        user_id=data.get('user_id') or None,
        session_id=data.get('session_id', ''),
        pages_read=data.get('pages_read', 0),
        time_spent=data.get('time_spent', 0),
        completed=bool(data.get('completed', False)),
    )
    return Response(BookViewSerializer(bv).data, status=201)


@api_view(['GET'])
def analytics_user(request, pk):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    sessions = UserSession.objects.filter(user=user).order_by('-started_at')[:20]
    bookviews = BookView.objects.filter(user=user).order_by('-created_at')[:20]
    return Response({
        'user': UserSerializer(user).data,
        'sessions': UserSessionSerializer(sessions, many=True).data,
        'bookviews': BookViewSerializer(bookviews, many=True).data,
    })


@api_view(['GET'])
def analytics_dashboard(request):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)
    thirty_mins_ago = timezone.now() - timedelta(minutes=30)
    popular_books = Book.objects.annotate(views_count=Count('views')).order_by('-views_count')[:10]
    device_stats = list(UserSession.objects.values('device_type').annotate(count=Count('id')))
    recent_sessions = UserSession.objects.order_by('-started_at')[:20]

    return Response({
        'total_users': User.objects.count(),
        'total_books': Book.objects.count(),
        'total_orders': Order.objects.count(),
        'total_sessions': UserSession.objects.count(),
        'active_sessions': UserSession.objects.filter(
            started_at__gte=thirty_mins_ago, is_active=True
        ).count(),
        'popular_books': [
            {'id': b.id, 'title': b.title, 'cover': b.cover, 'views': b.views_count}
            for b in popular_books
        ],
        'device_stats': [{'device': d['device_type'], 'count': d['count']} for d in device_stats],
        'recent_sessions': UserSessionSerializer(recent_sessions, many=True).data,
    })


# ---------------------------------------------------------------------------
# Site settings
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
def site_settings(request):
    if not _is_valid_token(_get_token(request)):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        rows = SiteSettings.objects.all()
        result = {}
        for row in rows:
            try:
                result[row.key] = json.loads(row.value)
            except (json.JSONDecodeError, ValueError):
                result[row.key] = row.value
        return Response(result)

    # POST — upsert multiple keys
    updates = request.data or {}
    for key, value in updates.items():
        SiteSettings.objects.update_or_create(
            key=key,
            defaults={'value': json.dumps(value)},
        )
    return Response({'saved': len(updates)})


# ---------------------------------------------------------------------------
# AI  (Google Gemini)
# ---------------------------------------------------------------------------

def _get_gemini_client():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    from google import genai
    return genai.Client(api_key=api_key)


@api_view(['POST'])
def ai_summary(request):
    title = request.data.get('title', '')
    author = request.data.get('author', '')
    description = request.data.get('description', '')
    client = _get_gemini_client()
    if not client:
        return Response({'error': 'AI sozlanmagan'}, status=503)
    try:
        prompt = (f"Quyidagi kitob haqida o'zbek tilida qisqa va mazmunli xulosa yoz:\n"
                  f"Nomi: {title}\nMuallif: {author}\nTavsif: {description}")
        result = client.models.generate_content(model='gemini-2.5-flash-lite', contents=prompt)
        return Response({'summary': result.text})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def ai_chat(request):
    message = request.data.get('message', '')
    book_context = request.data.get('bookContext', '')
    client = _get_gemini_client()
    if not client:
        return Response({'error': 'AI sozlanmagan'}, status=503)
    try:
        ctx = f"Kitob haqida: {book_context}\n\n" if book_context else ''
        prompt = (f"{ctx}Siz Neurolib kutubxonasining AI yordamchisisiz. "
                  f"Foydalanuvchi savoli: {message}")
        result = client.models.generate_content(model='gemini-2.5-flash-lite', contents=prompt)
        return Response({'response': result.text})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def ai_recommend(request):
    mood = request.data.get('mood', '')
    level = request.data.get('level', '')
    goal = request.data.get('goal', '')
    client = _get_gemini_client()
    if not client:
        return Response({'error': 'AI sozlanmagan'}, status=503)
    try:
        prompt = (f"Quyidagi parametrlarga mos keladigan 5 ta kitob tavsiya qil.\n"
                  f"Kayfiyat: {mood}, Daraja: {level}, Maqsad: {goal}\n"
                  f"JSON formatida qaytargil: [{{\"title\": \"...\", \"author\": \"...\", \"reason\": \"...\"}}]")
        result = client.models.generate_content(model='gemini-2.5-flash-lite', contents=prompt)
        import re
        json_match = re.search(r'\[[\s\S]*\]', result.text)
        books = json.loads(json_match.group()) if json_match else []
        return Response({'books': books})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def ai_search(request):
    query = request.data.get('query', '')
    client = _get_gemini_client()
    if not client:
        return Response({'error': 'AI sozlanmagan'}, status=503)
    try:
        prompt = (f"'{query}' qidiruviga mos keladigan kitoblarni top 5 ta qilib JSON formatida tavsiya qil: "
                  f"[{{\"title\": \"...\", \"author\": \"...\", \"description\": \"...\"}}]")
        result = client.models.generate_content(model='gemini-2.5-flash-lite', contents=prompt)
        import re
        json_match = re.search(r'\[[\s\S]*\]', result.text)
        books = json.loads(json_match.group()) if json_match else []
        return Response({'books': books, 'query': query})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
