const { Router } = require('express');
const { getDb } = require('../db/database');
const { requiresAdmin, extractAdminToken, isValidAdminToken } = require('../middleware/auth');

const router = Router();

async function attachItems(db, order) {
  order.items = await db.all(
    `SELECT oi.*, b.title as book_title FROM order_items oi LEFT JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?`,
    order.id
  );
  return order;
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const token = extractAdminToken(req);
    const isAdmin = isValidAdminToken(token);

    let orders;
    if (isAdmin) {
      orders = req.query.user_id
        ? await db.all('SELECT * FROM orders WHERE user_id = ?', req.query.user_id)
        : await db.all('SELECT * FROM orders');
    } else {
      if (!req.query.user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      orders = await db.all('SELECT * FROM orders WHERE user_id = ?', req.query.user_id);
    }

    for (const o of orders) await attachItems(db, o);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(await attachItems(db, order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { user_id, items } = req.body;
    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'user_id and items are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let total = 0;
    for (const item of items) {
      const book = await db.get('SELECT * FROM books WHERE id = ?', item.book_id);
      if (!book) return res.status(404).json({ error: `Book ${item.book_id} not found` });
      if (book.stock < item.quantity) return res.status(400).json({ error: `Not enough stock for ${book.title}` });
      total += book.price * item.quantity;
    }

    const orderResult = await db.run('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', [user_id, total]);
    for (const item of items) {
      const book = await db.get('SELECT * FROM books WHERE id = ?', item.book_id);
      await db.run('INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)', [orderResult.lastID, item.book_id, item.quantity, book.price]);
      await db.run('UPDATE books SET stock = stock - ? WHERE id = ?', [item.quantity, item.book_id]);
    }

    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', orderResult.lastID);
    res.status(201).json(await attachItems(db, newOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.run('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.status, req.params.id]);
    const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
    res.json(await attachItems(db, order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requiresAdmin, async (req, res) => {
  try {
    const db = getDb();
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', req.params.id);
    for (const item of items) {
      await db.run('UPDATE books SET stock = stock + ? WHERE id = ?', [item.quantity, item.book_id]);
    }
    await db.run('DELETE FROM orders WHERE id = ?', req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
