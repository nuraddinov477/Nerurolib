import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, buildApiUrl } from '../config/api';

export const DataContext = createContext();

export const API_URL = API_BASE;

// Generate unique session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
};

// Detect browser
const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
};

// Detect OS
const getOS = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Other';
};

const mapUserFromApi = (user) => ({
  id: user.id,
  name: user.full_name || user.username,
  email: user.email,
  role: user.is_admin ? 'admin' : 'user'
});

export const DataProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([
    'Классика',
    'Художественная литература',
    'Научная фантастика',
    'Детская литература',
    'Биография',
    'Самопомощь'
  ]);

  const [users, setUsers] = useState([]);

  // Track session on mount
  useEffect(() => {
    const trackSession = async () => {
      try {
        await axios.post(`${API_URL}/analytics/session`, {
          session_id: getSessionId(),
          user_id: null, // Add user ID if logged in
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS()
        });
      } catch (error) {
        console.log('Analytics tracking disabled');
      }
    };
    trackSession();
  }, []);

  // Track page views
  const trackPageView = async (pageUrl, pageTitle) => {
    try {
      await axios.post(`${API_URL}/analytics/pageview`, {
        session_id: getSessionId(),
        user_id: null,
        page_url: pageUrl,
        page_title: pageTitle,
        referrer: document.referrer
      });
    } catch (error) {
      console.log('Page view tracking failed');
    }
  };

  // Track book reading
  const trackBookView = async (bookId, pagesRead, timeSpent) => {
    try {
      await axios.post(`${API_URL}/analytics/bookview`, {
        book_id: bookId,
        user_id: null,
        session_id: getSessionId(),
        pages_read: pagesRead,
        time_spent: timeSpent
      });
    } catch (error) {
      console.log('Book view tracking failed');
    }
  };

  // Загрузить книги с бэкенда
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${API_URL}/books`);
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        } else {
          const savedBooks = localStorage.getItem('books');
          if (savedBooks) setBooks(JSON.parse(savedBooks));
        }
      } catch (error) {
        console.log('Backend not available, using localStorage');
        const savedBooks = localStorage.getItem('books');
        if (savedBooks) setBooks(JSON.parse(savedBooks));
      } finally {
        setBooksLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) return;
        const data = await response.json();
        setCategories(data.map(c => c.name));
      } catch (error) {
        // keep local defaults
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) return;
        const data = await response.json();
        setUsers(data.map(mapUserFromApi));
      } catch (error) {
        // keep local fallback
      }
    };

    const fetchOrders = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const headers = adminToken ? { 'X-Admin-Token': adminToken } : {};
        const endpoint = adminToken ? buildApiUrl('/orders') : buildApiUrl('/orders?user_id=1');
        const response = await fetch(endpoint, { headers });
        if (!response.ok) return;
        const data = await response.json();
        setOrders(data.map(order => ({
          id: order.id,
          items: (order.items || []).map(item => ({
            id: item.id,
            title: item.book_title || item.title || `Book #${item.book_id}`,
            cover: item.cover || '📕',
            quantity: item.quantity,
            price: item.price
          })),
          total: order.total_amount,
          date: order.created_at,
          status: order.status
        })));
      } catch (error) {
        // keep local fallback
      }
    };

    fetchBooks();
    fetchCategories();
    fetchUsers();
    fetchOrders();

    // Listen for storage changes (from auto-import)
    const handleStorageChange = () => {
      const savedBooks = localStorage.getItem('books');
      if (savedBooks) setBooks(JSON.parse(savedBooks));
    };

    window.addEventListener('storage', handleStorageChange);

    // Загрузить корзину и заказы из localStorage
    const savedCart = localStorage.getItem('cart');
    const savedOrders = localStorage.getItem('orders');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Сохранить корзину в localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Сохранить заказы в localStorage
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Сохранить книги в localStorage при изменении (как резервный вариант)
  useEffect(() => {
    // Не сохраняем в localStorage, если данные слишком большие
    // Книги хранятся в базе данных, localStorage только для резервного доступа
    try {
      // Сохраняем только если массив не пустой и не слишком большой
      if (books.length > 0 && books.length < 100) {
        // Создаем упрощенную версию без PDF данных для экономии места
        const booksToSave = books.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          price: book.price,
          cover: book.cover,
          description: book.description,
          stock: book.stock,
          has_pdf: book.has_pdf,
          pdf_url: book.pdf_url,
          external_url: book.external_url || book.pdf_url || null
          // НЕ сохраняем pdf_data - он занимает много места
        }));
        localStorage.setItem('books', JSON.stringify(booksToSave));
      }
    } catch (error) {
      // Если квота превышена, очищаем старые данные книг
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing books cache');
        localStorage.removeItem('books');
      }
    }
  }, [books]);

  const refreshBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/books`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.log('Could not refresh books from API');
    }
  };

  const addBook = async (book) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers['X-Admin-Token'] = adminToken;

      const payload = {
        title: book.title,
        author: book.author,
        category: book.category,
        price: book.price !== undefined && book.price !== null ? parseFloat(book.price) : 0,
        cover: book.cover,
        description: book.description,
        stock: parseInt(book.stock)
      };
      if (book.pdf_data) payload.pdf_data = book.pdf_data;
      if (book.pdf_url) payload.pdf_url = book.pdf_url;

      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newBook = await response.json();
        setBooks(prev => [...prev, newBook]);
      } else {
        setBooks(prev => {
          const newBook = {
            id: Math.max(...prev.map(b => b.id), 0) + 1,
            ...book,
            stock: parseInt(book.stock),
            has_pdf: !!book.pdf_data || !!book.pdf_url
          };
          return [...prev, newBook];
        });
      }
    } catch (error) {
      console.log('Adding book to localStorage');
      setBooks(prev => {
        const newBook = {
          id: Math.max(...prev.map(b => b.id), 0) + 1,
          ...book,
          stock: parseInt(book.stock),
          has_pdf: !!book.pdf_data || !!book.pdf_url
        };
        return [...prev, newBook];
      });
    }
  };

  const updateBook = async (id, updatedBook) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers['X-Admin-Token'] = adminToken;

      const payload = {
        title: updatedBook.title,
        author: updatedBook.author,
        category: updatedBook.category,
        // keep price numeric; default to 0 if not provided
        price: updatedBook.price !== undefined && updatedBook.price !== null ? parseFloat(updatedBook.price) : 0,
        cover: updatedBook.cover,
        description: updatedBook.description,
        stock: parseInt(updatedBook.stock)
      };
      if (updatedBook.pdf_data) payload.pdf_data = updatedBook.pdf_data;
      if (updatedBook.pdf_url !== undefined) payload.pdf_url = updatedBook.pdf_url;

      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setBooks(books.map(b => b.id === id ? updated : b));
      } else {
        // Fallback: update in localStorage
        setBooks(books.map(b => b.id === id ? { ...b, ...updatedBook, stock: parseInt(updatedBook.stock), has_pdf: !!updatedBook.pdf_data || !!updatedBook.pdf_url } : b));
      }
    } catch (error) {
      console.log('Updating book in localStorage');
      setBooks(books.map(b => b.id === id ? { ...b, ...updatedBook, stock: parseInt(updatedBook.stock), has_pdf: !!updatedBook.pdf_data || !!updatedBook.pdf_url } : b));
    }
  };

  const deleteBook = async (id) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = {};
      if (adminToken) headers['X-Admin-Token'] = adminToken;

      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        setBooks(books.filter(b => b.id !== id));
      } else {
        // Fallback: delete from localStorage
        setBooks(books.filter(b => b.id !== id));
      }
    } catch (error) {
      console.log('Deleting book from localStorage');
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const addToCart = (book) => {
    const existingItem = cart.find(item => item.id === book.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === book.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...book, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    const payload = {
      user_id: 1,
      items: cart.map(item => ({
        book_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const created = await response.json();
        const normalized = {
          id: created.id,
          items: (created.items || []).map(item => ({
            id: item.id,
            title: item.book_title || item.title || `Book #${item.book_id}`,
            cover: item.cover || '📕',
            quantity: item.quantity,
            price: item.price
          })),
          total: created.total_amount,
          date: created.created_at || new Date().toISOString(),
          status: created.status
        };
        setOrders(prev => [...prev, normalized]);
        setCart([]);
        return;
      }
    } catch (error) {
      // fallback below
    }

    const order = {
      id: orders.length + 1,
      items: cart,
      total: calculateTotal(),
      date: new Date().toLocaleDateString(),
      status: 'pending'
    };
    setOrders([...orders, order]);
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const addCategory = (category) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (adminToken) headers['X-Admin-Token'] = adminToken;

    // Try backend first
    (async () => {
      try {
        const res = await fetch(`${API_URL}/categories`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: category })
        });
        if (res.ok) {
          // refresh local list
          setCategories(prev => prev.includes(category) ? prev : [...prev, category]);
          return;
        }
      } catch (e) {
        // ignore and fallback to local
      }
      if (!categories.includes(category)) setCategories([...categories, category]);
    })();
  };

  const deleteCategory = (category) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = {};
    if (adminToken) headers['X-Admin-Token'] = adminToken;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/categories/${encodeURIComponent(category)}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          setCategories(categories.filter(c => c !== category));
          return;
        }
      } catch (e) {
        // fallback to local
      }
      setCategories(categories.filter(c => c !== category));
    })();
  };

  const addUser = (user) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (adminToken) headers['X-Admin-Token'] = adminToken;

    (async () => {
      try {
        const baseUsername = (user.name || user.email || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^\.+|\.+$/g, '') || `user${Date.now()}`;
        const payload = {
          username: `${baseUsername}${Math.floor(Math.random() * 1000)}`,
          email: user.email,
          password: 'change-me-123',
          full_name: user.name || '',
          is_admin: user.role === 'admin'
        };

        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setUsers(prev => [...prev, mapUserFromApi(created)]);
          return;
        }
      } catch (e) {
        // fallback
      }
      const newUser = { id: Math.max(...users.map(u => u.id), 0) + 1, ...user, role: user.role || 'user' };
      setUsers([...users, newUser]);
    })();
  };

  const deleteUser = (id) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = {};
    if (adminToken) headers['X-Admin-Token'] = adminToken;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          setUsers(users.filter(u => u.id !== id));
          return;
        }
      } catch (e) {
        // fallback
      }
      setUsers(users.filter(u => u.id !== id));
    })();
  };

  const updateOrder = (id, status) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (adminToken) headers['X-Admin-Token'] = adminToken;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          const updated = await res.json();
          const normalized = {
            id: updated.id,
            items: (updated.items || []).map(item => ({
              id: item.id,
              title: item.book_title || item.title || `Book #${item.book_id}`,
              cover: item.cover || '📕',
              quantity: item.quantity,
              price: item.price
            })),
            total: updated.total_amount,
            date: updated.created_at,
            status: updated.status
          };
          setOrders(prev => prev.map(o => o.id === id ? normalized : o));
          return;
        }
      } catch (e) {
        // fallback
      }
      setOrders(orders.map(order => order.id === id ? { ...order, status } : order));
    })();
  };

  const value = {
    books,
    booksLoading,
    refreshBooks,
    addBook,
    updateBook,
    deleteBook,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    calculateTotal,
    checkout,
    orders,
    updateOrder,
    categories,
    addCategory,
    deleteCategory,
    users,
    addUser,
    deleteUser,
    trackPageView,
    trackBookView
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
