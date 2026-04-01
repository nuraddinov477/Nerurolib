const { Router } = require('express');
const { getDb } = require('../db/database');
const { requiresAdmin } = require('../middleware/auth');

const router = Router();

function parseValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

router.get('/', requiresAdmin, async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db.all('SELECT key, value FROM site_settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = parseValue(row.value);
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const updates = req.body || {};
    const entries = Object.entries(updates);
    for (const [key, value] of entries) {
      await db.run(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP',
        [key, JSON.stringify(value)]
      );
    }
    res.json({ saved: entries.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
