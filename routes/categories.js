const { Router } = require('express');
const { getDb } = require('../db/database');
const { requiresAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    res.json(await db.all('SELECT * FROM categories'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const existing = await db.get('SELECT * FROM categories WHERE name = ?', name);
    if (existing) return res.status(409).json({ error: 'Category already exists' });

    const result = await db.run('INSERT INTO categories (name) VALUES (?)', name);
    res.status(201).json(await db.get('SELECT * FROM categories WHERE id = ?', result.lastID));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const key = req.params.id;
    if (/^\d+$/.test(key)) {
      await db.run('DELETE FROM categories WHERE id = ?', key);
    } else {
      await db.run('DELETE FROM categories WHERE name = ?', decodeURIComponent(key));
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
