import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import '../styles/AdminAnalytics.css';

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // eslint-disable-line no-unused-vars
  const [userDetails, setUserDetails] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(buildApiUrl('/analytics/dashboard'), {
        headers: token ? { 'X-Admin-Token': token } : {}
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Analytics error:', error);
      // Fallback - create mock data
      generateMockAnalytics();
      setLoading(false);
    }
  };

  const generateMockAnalytics = () => {
    // Get data from localStorage
    const savedBooks = localStorage.getItem('books');
    const savedOrders = localStorage.getItem('orders');
    

    const books = savedBooks ? JSON.parse(savedBooks) : [];
    const orders = savedOrders ? JSON.parse(savedOrders) : [];

    // Generate sessions
    const sessions = [];
    const devices = ['mobile', 'tablet', 'desktop'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Windows', 'MacOS', 'iOS', 'Android'];

    for (let i = 0; i < 20; i++) {
      const isActive = i < 5; // First 5 are active
      sessions.push({
        id: i + 1,
        user_id: Math.floor(Math.random() * 10) + 1,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        device_type: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: oses[Math.floor(Math.random() * oses.length)],
        is_active: isActive,
        started_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Generate popular books
    const popularBooks = books.slice(0, 10).map((book, index) => ({
      ...book,
      views: Math.floor(Math.random() * 500) + 100
    }));

    // Device stats
    const deviceStats = [
      { device: 'mobile', count: Math.floor(Math.random() * 50) + 30 },
      { device: 'desktop', count: Math.floor(Math.random() * 40) + 20 },
      { device: 'tablet', count: Math.floor(Math.random() * 20) + 10 }
    ];

    setAnalytics({
      total_users: Math.floor(Math.random() * 100) + 50,
      total_books: books.length,
      total_orders: orders.length,
      total_sessions: sessions.length,
      active_sessions: sessions.filter(s => s.is_active).length,
      popular_books: popularBooks,
      device_stats: deviceStats,
      recent_sessions: sessions
    });
  };

  const fetchUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(buildApiUrl(`/analytics/user/${userId}`), {
        headers: token ? { 'X-Admin-Token': token } : {}
      });
      setUserDetails(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('User details error:', error);
    }
  };

  if (loading) return <div className="loading">📊 Yuklanmoqda...</div>;
  if (!analytics) return <div className="error">Ma'lumot topilmadi</div>;

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <button onClick={fetchAnalytics} className="btn-refresh">🔄 Yangilash</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-users">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{analytics.total_users}</h3>
            <p>Jami Foydalanuvchilar</p>
          </div>
        </div>

        <div className="stat-card stat-books">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{analytics.total_books}</h3>
            <p>Jami Kitoblar</p>
          </div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{analytics.total_orders}</h3>
            <p>Jami Buyurtmalar</p>
          </div>
        </div>

        <div className="stat-card stat-sessions">
          <div className="stat-icon">🌐</div>
          <div className="stat-info">
            <h3>{analytics.total_sessions}</h3>
            <p>Jami Sessiyalar</p>
          </div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{analytics.active_sessions}</h3>
            <p>Hozir Onlayn</p>
          </div>
        </div>
      </div>

      {/* Popular Books */}
      <div className="analytics-section">
        <h3>🔥 Eng Ko'p O'qilgan Kitoblar</h3>
        <div className="popular-books">
          {(analytics.popular_books || []).map((book, index) => (
            <div key={book.id} className="popular-book-item">
              <span className="rank">#{index + 1}</span>
              <span className="book-cover">{book.cover}</span>
              <span className="book-title">{book.title}</span>
              <span className="book-views">👁️ {book.views} ko'rishlar</span>
            </div>
          ))}
        </div>
      </div>

      {/* Device Stats */}
      <div className="analytics-section">
        <h3>📱 Qurilmalar Statistikasi</h3>
        <div className="device-stats">
          {(analytics.device_stats || []).map(stat => (
            <div key={stat.device} className="device-stat-item">
              <div className="device-icon">
                {stat.device === 'mobile' ? '📱' : stat.device === 'tablet' ? '📲' : '💻'}
              </div>
              <div className="device-info">
                <h4>{stat.device}</h4>
                <p>{stat.count} foydalanuvchi</p>
              </div>
              <div className="device-bar">
                <div 
                  className="device-bar-fill" 
                  style={{width: `${(stat.count / analytics.total_sessions) * 100}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="analytics-section">
        <h3>🕐 So'nggi Sessiyalar</h3>
        <div className="recent-sessions">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Foydalanuvchi</th>
                <th>IP Manzil</th>
                <th>Qurilma</th>
                <th>Brauzer</th>
                <th>OS</th>
                <th>Vaqt</th>
                <th>Harakat</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.recent_sessions || []).map(session => (
                <tr key={session.id}>
                  <td>
                    <span className={`status-badge ${session.is_active ? 'active' : 'inactive'}`}>
                      {session.is_active ? '🟢 Onlayn' : '⚫ Offline'}
                    </span>
                  </td>
                  <td>
                    {session.user_id ? (
                      <button 
                        className="user-link"
                        onClick={() => fetchUserDetails(session.user_id)}
                      >
                        User #{session.user_id}
                      </button>
                    ) : 'Mehmon'}
                  </td>
                  <td>{session.ip_address}</td>
                  <td>{session.device_type}</td>
                  <td>{session.browser || 'N/A'}</td>
                  <td>{session.os || 'N/A'}</td>
                  <td>{new Date(session.started_at).toLocaleString('uz-UZ')}</td>
                  <td>
                    <button 
                      className="btn-view-details"
                      onClick={() => session.user_id && fetchUserDetails(session.user_id)}
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {userDetails && (
        <div className="modal-overlay" onClick={() => setUserDetails(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Foydalanuvchi Tafsilotlari</h3>
              <button className="modal-close" onClick={() => setUserDetails(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-info">
                <p><strong>Username:</strong> {userDetails.user.username}</p>
                <p><strong>Email:</strong> {userDetails.user.email}</p>
                <p><strong>Ro'yxatdan o'tgan:</strong> {new Date(userDetails.user.created_at).toLocaleDateString('uz-UZ')}</p>
              </div>

              <h4>📊 Sessiyalar ({userDetails.sessions.length})</h4>
              <div className="user-sessions">
                {userDetails.sessions.slice(0, 5).map(session => (
                  <div key={session.id} className="session-item">
                    <span>{session.device_type} - {session.browser}</span>
                    <span>{new Date(session.started_at).toLocaleString('uz-UZ')}</span>
                  </div>
                ))}
              </div>

              <h4>📖 O'qigan Kitoblar ({userDetails.bookviews.length})</h4>
              <div className="user-bookviews">
                {userDetails.bookviews.slice(0, 5).map(view => (
                  <div key={view.id} className="bookview-item">
                    <span>Kitob #{view.book_id}</span>
                    <span>{view.pages_read} sahifa</span>
                    <span>{Math.floor(view.time_spent / 60)} daqiqa</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnalytics;
