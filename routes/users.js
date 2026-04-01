const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requiresAdmin } = require('../middleware/auth');

const router = Router();

const PUBLIC_FIELDS = 'id, username, email, full_name, is_admin, created_at';

router.get('/', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all(`SELECT ${PUBLIC_FIELDS} FROM users`);
    res.json(users.map(u => ({ ...u, is_admin: u.is_admin === 1 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const user = await db.get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.is_admin = user.is_admin === 1;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { username, email, password, full_name, is_admin } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.run(
      'INSERT INTO users (username, email, password, full_name, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, hashedPassword, full_name || '', is_admin ? 1 : 0]
    );
    const newUser = await db.get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [result.lastID]);
    newUser.is_admin = newUser.is_admin === 1;
    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { full_name, is_admin } = req.body;
    await db.run('UPDATE users SET full_name=$1, is_admin=$2 WHERE id=$3', [full_name, is_admin ? 1 : 0, req.params.id]);
    const updated = await db.get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [req.params.id]);
    updated.is_admin = updated.is_admin === 1;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.run('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
