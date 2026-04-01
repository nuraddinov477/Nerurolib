const { Router } = require('express');
const { getDb } = require('../db/database');
const { requiresAdmin } = require('../middleware/auth');

const router = Router();

router.post('/session', async (req, res) => {
  try {
    const db = getDb();
    const { user_id, session_id, device_type, browser, os, country } = req.body;
    const result = await db.run(
      'INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, device_type, browser, os, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, session_id, req.ip, req.headers['user-agent'], device_type, browser, os, country]
    );
    res.status(201).json(await db.get('SELECT * FROM user_sessions WHERE id = ?', result.lastID));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pageview', async (req, res) => {
  try {
    const db = getDb();
    const { session_id, user_id, page_url, page_title, referrer, time_spent } = req.body;
    const result = await db.run(
      'INSERT INTO page_views (session_id, user_id, page_url, page_title, referrer, time_spent) VALUES (?, ?, ?, ?, ?, ?)',
      [session_id, user_id, page_url, page_title, referrer, time_spent || 0]
    );
    res.status(201).json(await db.get('SELECT * FROM page_views WHERE id = ?', result.lastID));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookview', async (req, res) => {
  try {
    const db = getDb();
    const { book_id, user_id, session_id, pages_read, time_spent, completed } = req.body;
    const result = await db.run(
      'INSERT INTO book_views (book_id, user_id, session_id, pages_read, time_spent, completed) VALUES (?, ?, ?, ?, ?, ?)',
      [book_id, user_id, session_id, pages_read || 0, time_spent || 0, completed ? 1 : 0]
    );
    res.status(201).json(await db.get('SELECT * FROM book_views WHERE id = ?', result.lastID));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const user = await db.get('SELECT id, username, email, full_name, is_admin, created_at FROM users WHERE id = ?', req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const sessions = await db.all('SELECT * FROM user_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20', req.params.id);
    const bookviews = await db.all('SELECT * FROM book_views WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', req.params.id);
    res.json({ user, sessions, bookviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const [totalUsers, totalBooks, totalOrders, totalSessions, activeSessions, popularBooks, deviceStats, recentSessions] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM users'),
      db.get('SELECT COUNT(*) as count FROM books'),
      db.get('SELECT COUNT(*) as count FROM orders'),
      db.get('SELECT COUNT(*) as count FROM user_sessions'),
      db.get(`SELECT COUNT(*) as count FROM user_sessions WHERE datetime(started_at) >= datetime('now', '-30 minutes') AND is_active = 1`),
      db.all(`SELECT b.id, b.title, b.cover, COUNT(bv.id) as views FROM books b LEFT JOIN book_views bv ON b.id = bv.book_id GROUP BY b.id ORDER BY views DESC LIMIT 10`),
      db.all('SELECT device_type as device, COUNT(*) as count FROM user_sessions GROUP BY device_type'),
      db.all('SELECT * FROM user_sessions ORDER BY started_at DESC LIMIT 20'),
    ]);
    res.json({
      total_users: totalUsers.count,
      total_books: totalBooks.count,
      total_orders: totalOrders.count,
      total_sessions: totalSessions.count,
      active_sessions: activeSessions.count,
      popular_books: popularBooks,
      device_stats: deviceStats,
      recent_sessions: recentSessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
