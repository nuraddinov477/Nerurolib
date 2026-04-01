import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import AdminBooks from '../components/AdminBooks';
import AdminCategories from '../components/AdminCategories';
import AdminUsersAdvanced from '../components/AdminUsersAdvanced';
import AdminOrders from '../components/AdminOrders';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminAutoImport from '../components/AdminAutoImport';
import AdminSettings from '../components/AdminSettings';
import AdminAudiobooks from '../components/AdminAudiobooks';
import AdminSubscriptions from '../components/AdminSubscriptions';
import AdminModeration from '../components/AdminModeration';
import AdminSecurity from '../components/AdminSecurity';
import { buildApiUrl } from '../config/api';
import '../styles/AdminPanel.css';

const MENU = [
  {
    group: 'Asosiy',
    items: [
      { key: 'dashboard', icon: '📊', label: 'Overview' },
      { key: 'analytics', icon: '📈', label: 'Analitika' },
    ],
  },
  {
    group: 'Kontent',
    items: [
      { key: 'books', icon: '📚', label: 'Kitoblar' },
      { key: 'audiobooks', icon: '🎧', label: 'Audiokitoblar' },
      { key: 'categories', icon: '🏷️', label: 'Kategoriyalar' },
      { key: 'autoimport', icon: '🤖', label: 'Avto Import' },
    ],
  },
  {
    group: 'Foydalanuvchilar',
    items: [
      { key: 'users', icon: '👥', label: 'Foydalanuvchilar' },
      { key: 'moderation', icon: '🛡️', label: 'Moderatsiya' },
      { key: 'security', icon: '🔐', label: 'Xavfsizlik' },
    ],
  },
  {
    group: 'Tijorat',
    items: [
      { key: 'subscriptions', icon: '💳', label: 'Obuna & To\'lovlar' },
      { key: 'orders', icon: '📦', label: 'Buyurtmalar' },
    ],
  },
  {
    group: 'Tizim',
    items: [
      { key: 'settings', icon: '⚙️', label: 'Sozlamalar' },
    ],
  },
];

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(3);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/admin/login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Noto\'g\'ri parol! Qaytadan urinib ko\'ring.');
      }
    } catch {
      setError('Server bilan bog\'lanishda xato.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  const activeItem = MENU.flatMap(g => g.items).find(i => i.key === activeTab);

  if (!isAuthenticated) {
    return (
      <div className="ap-login-wrap">
        <div className="ap-login-box">
          <div className="ap-login-logo">
            <span className="ap-login-icon">🔐</span>
            <h1>Neurolib Admin</h1>
          </div>
          <p className="ap-login-sub">Boshqaruv paneliga kirish</p>
          <form onSubmit={handleLogin} className="ap-login-form">
            <label>Parol</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin parolini kiriting"
              required
              autoFocus
            />
            {error && <div className="ap-login-error">⚠️ {error}</div>}
            <button type="submit" className="ap-login-btn" disabled={loading}>
              {loading ? '⏳ Tekshirilmoqda...' : 'Kirish →'}
            </button>
            <button type="button" className="ap-login-back" onClick={() => navigate('/')}>
              ← Bosh sahifaga
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`ap-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

      {/* ── SIDEBAR ── */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar-header">
          <span className="ap-logo-icon">📚</span>
          {sidebarOpen && <span className="ap-logo-text">Neurolib</span>}
        </div>

        <nav className="ap-nav">
          {MENU.map(group => (
            <div key={group.group} className="ap-nav-group">
              {sidebarOpen && <span className="ap-nav-group-label">{group.group}</span>}
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`ap-nav-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="ap-nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="ap-nav-label">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button className="ap-sidebar-logout" onClick={handleLogout} title="Chiqish">
          <span>🚪</span>
          {sidebarOpen && <span>Chiqish</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="ap-main">

        {/* TOP BAR */}
        <header className="ap-topbar">
          <div className="ap-topbar-left">
            <button className="ap-toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <div className="ap-breadcrumb">
              <span className="ap-breadcrumb-root">Admin</span>
              <span className="ap-breadcrumb-sep">›</span>
              <span className="ap-breadcrumb-current">
                {activeItem ? `${activeItem.icon} ${activeItem.label}` : ''}
              </span>
            </div>
          </div>

          <div className="ap-topbar-center">
            <div className="ap-search">
              <span className="ap-search-icon">🔍</span>
              <input type="text" placeholder="Qidirish..." className="ap-search-input" />
            </div>
          </div>

          <div className="ap-topbar-right">
            <button className="ap-notif-btn">
              🔔
              {notifications > 0 && <span className="ap-notif-badge">{notifications}</span>}
            </button>
            <div className="ap-admin-avatar">
              <span>👤</span>
              <span className="ap-admin-name">Admin</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="ap-content">
          {activeTab === 'dashboard'     && <AdminDashboard onNavigate={setActiveTab} />}
          {activeTab === 'analytics'     && <AdminAnalytics />}
          {activeTab === 'books'         && <AdminBooks />}
          {activeTab === 'audiobooks'    && <AdminAudiobooks />}
          {activeTab === 'categories'    && <AdminCategories />}
          {activeTab === 'autoimport'    && <AdminAutoImport />}
          {activeTab === 'users'         && <AdminUsersAdvanced />}
          {activeTab === 'moderation'    && <AdminModeration />}
          {activeTab === 'security'      && <AdminSecurity />}
          {activeTab === 'subscriptions' && <AdminSubscriptions />}
          {activeTab === 'orders'        && <AdminOrders />}
          {activeTab === 'settings'      && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
