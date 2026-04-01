// db/database.js — JSON file storage, no database server required
'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const TABLES   = [
  'users', 'books', 'categories', 'orders', 'order_items',
  'user_sessions', 'page_views', 'book_views', 'site_settings',
];

/* ── in-memory store ─────────────────────────────────── */
const store    = {};
const counters = {};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Buffer ↔ base64 helpers for books.pdf_data
function serializeRecord(table, r) {
  if (table === 'books' && r.pdf_data && Buffer.isBuffer(r.pdf_data)) {
    return { ...r, pdf_data: '__b64__' + r.pdf_data.toString('base64') };
  }
  return r;
}
function deserializeRecord(table, r) {
  if (table === 'books' && typeof r.pdf_data === 'string' && r.pdf_data.startsWith('__b64__')) {
    return { ...r, pdf_data: Buffer.from(r.pdf_data.slice(7), 'base64') };
  }
  if (table === 'books' && r.pdf_data && r.pdf_data.type === 'Buffer') {
    return { ...r, pdf_data: Buffer.from(r.pdf_data.data) };
  }
  return r;
}

function loadAll() {
  ensureDir();
  for (const t of TABLES) {
    const file = path.join(DATA_DIR, `${t}.json`);
    if (fs.existsSync(file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        store[t]    = raw.map(r => deserializeRecord(t, r));
        counters[t] = store[t].reduce((m, r) => Math.max(m, r.id || 0), 0);
      } catch { store[t] = []; counters[t] = 0; }
    } else {
      store[t] = []; counters[t] = 0;
    }
  }
}

function persist(table) {
  ensureDir();
  const data = store[table].map(r => serializeRecord(table, r));
  fs.writeFileSync(path.join(DATA_DIR, `${table}.json`), JSON.stringify(data, null, 2));
}

function nextId(table) {
  counters[table] = (counters[table] || 0) + 1;
  return counters[table];
}

function now() { return new Date().toISOString(); }

/* ── helpers ─────────────────────────────────────────── */
function toArray(p) {
  if (p === undefined || p === null) return [];
  return Array.isArray(p) ? p : [p];
}
function normalise(sql) {
  return sql.replace(/\$\d+/g, '?').replace(/\s+/g, ' ').trim();
}

/* ── WHERE evaluator ─────────────────────────────────── */
function evalWhere(record, clause, params) {
  if (!clause) return true;

  // SQLite datetime special case (analytics active sessions)
  if (/datetime/i.test(clause)) {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const inTime = !record.started_at || record.started_at >= cutoff;
    const active = /is_active\s*=\s*1/i.test(clause) ? Number(record.is_active) === 1 : true;
    return inTime && active;
  }

  const parts = clause.split(/\s+AND\s+/i);
  let pi = 0;
  for (const part of parts) {
    const m = part.trim().match(/^([\w.]+)\s*(=|!=|<|>)\s*(.+)$/i);
    if (!m) continue;
    const [, rawField, op, valToken] = m;
    const field = rawField.includes('.') ? rawField.split('.').pop() : rawField;
    let val;
    if (valToken === '?')              { val = params[pi++]; }
    else if (valToken.startsWith("'")) { val = valToken.slice(1, -1); }
    else                               { val = valToken; }

    const rec = String(record[field] ?? '');
    const v   = String(val ?? '');
    if (op === '='  && rec !== v) return false;
    if (op === '!=' && rec === v) return false;
  }
  return true;
}

/* ── SELECT ──────────────────────────────────────────── */
function execSelect(q, params) {
  const table = (q.match(/FROM\s+(\w+)/i) || [])[1];

  // COUNT(*)
  if (/COUNT\(\*\)/i.test(q)) {
    let rows = [...(store[table] || [])];
    const wm = q.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/i);
    if (wm) rows = rows.filter(r => evalWhere(r, wm[1], params));
    return { count: rows.length };
  }

  // JOIN order_items + books  (orders route)
  if (/JOIN\s+books/i.test(q) && table === 'order_items') {
    const orderId = String(params[0]);
    return (store.order_items || [])
      .filter(r => String(r.order_id) === orderId)
      .map(oi => {
        const book = (store.books || []).find(b => String(b.id) === String(oi.book_id));
        return { ...oi, book_title: book?.title ?? null };
      });
  }

  // JOIN books + book_views  (analytics popular books)
  if (/JOIN\s+book_views/i.test(q)) {
    const counts = {};
    for (const bv of (store.book_views || [])) counts[bv.book_id] = (counts[bv.book_id] || 0) + 1;
    let result = (store.books || []).map(b => ({
      id: b.id, title: b.title, cover: b.cover, views: counts[b.id] || 0,
    })).sort((a, b) => b.views - a.views);
    const lim = (q.match(/LIMIT\s+(\d+)/i) || [])[1];
    return lim ? result.slice(0, parseInt(lim)) : result;
  }

  // GROUP BY (device stats)
  if (/GROUP BY\s+(\w+)/i.test(q)) {
    const gf = (q.match(/GROUP BY\s+(\w+)/i) || [])[1];
    const map = {};
    for (const r of (store[table] || [])) map[r[gf]] = (map[r[gf]] || 0) + 1;
    return Object.entries(map).map(([k, count]) => ({ device: k, count }));
  }

  // Standard SELECT
  const fieldsM = q.match(/^SELECT\s+(.+?)\s+FROM/i);
  const fieldsStr = (fieldsM ? fieldsM[1] : '*').trim();
  const selectAll = fieldsStr === '*';
  const fields = selectAll ? null : fieldsStr.split(',').map(f => f.trim());

  let rows = [...(store[table] || [])];

  // WHERE
  const wm = q.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|\s+GROUP BY|$)/i);
  if (wm) rows = rows.filter(r => evalWhere(r, wm[1], params));

  // ORDER BY
  const om = q.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (om) {
    const [, field, dir] = om;
    rows.sort((a, b) => {
      const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      return dir?.toUpperCase() === 'DESC' ? -cmp : cmp;
    });
  }

  // LIMIT
  const lm = q.match(/LIMIT\s+(\d+)/i);
  if (lm) rows = rows.slice(0, parseInt(lm[1]));

  // Field projection
  if (fields) {
    rows = rows.map(r => {
      const obj = {};
      for (const f of fields) {
        const col   = f.replace(/\s+AS\s+\w+/i, '').trim();
        const alias = (f.match(/AS\s+(\w+)/i) || [])[1];
        obj[alias || col] = r[col];
      }
      return obj;
    });
  }

  return rows;
}

/* ── INSERT ──────────────────────────────────────────── */
function execInsert(q, params) {
  const table = (q.match(/INSERT INTO\s+(\w+)/i) || [])[1];
  if (!table) return { lastID: null, changes: 0 };

  const fm = q.match(/\(([^)]+)\)\s+VALUES/i);
  if (!fm) return { lastID: null, changes: 0 };
  const fields = fm[1].split(',').map(f => f.trim());

  function buildRecord(extraId) {
    const r = {};
    fields.forEach((f, i) => {
      r[f] = (f === 'updated_at' || f === 'created_at') && params[i] === undefined
        ? now()
        : params[i] ?? null;
    });
    // Handle CURRENT_TIMESTAMP in VALUES position (settings route)
    fields.forEach((f, i) => {
      if (String(params[i]).toUpperCase() === 'CURRENT_TIMESTAMP') r[f] = now();
    });
    const id = extraId ?? nextId(table);
    return { id, created_at: now(), updated_at: now(), ...r };
  }

  // UPSERT: ON CONFLICT(key) DO UPDATE
  if (/ON CONFLICT.*DO UPDATE/i.test(q)) {
    const keyField = (q.match(/ON CONFLICT\s*\((\w+)\)/i) || [])[1];
    const incoming = {};
    fields.forEach((f, i) => { incoming[f] = params[i]; });
    if (incoming.updated_at === undefined) incoming.updated_at = now();

    if (keyField) {
      const idx = store[table].findIndex(r => String(r[keyField]) === String(incoming[keyField]));
      if (idx !== -1) {
        store[table][idx] = { ...store[table][idx], ...incoming, updated_at: now() };
        persist(table);
        return { lastID: store[table][idx].id, changes: 1 };
      }
    }
    const newR = { id: nextId(table), created_at: now(), ...incoming };
    store[table].push(newR);
    persist(table);
    return { lastID: newR.id, changes: 1 };
  }

  // ON CONFLICT DO NOTHING
  if (/ON CONFLICT.*DO NOTHING/i.test(q)) {
    const incoming = {};
    fields.forEach((f, i) => { incoming[f] = params[i]; });
    if (incoming.id !== undefined && store[table].find(r => String(r.id) === String(incoming.id))) {
      return { lastID: incoming.id, changes: 0 };
    }
    if (incoming.username && store[table].find(r => r.username === incoming.username)) {
      return { lastID: null, changes: 0 };
    }
    const id = incoming.id ? Number(incoming.id) : nextId(table);
    if (incoming.id) counters[table] = Math.max(counters[table] || 0, id);
    store[table].push({ id, created_at: now(), updated_at: now(), ...incoming });
    persist(table);
    return { lastID: id, changes: 1 };
  }

  // Uniqueness checks
  if (table === 'users') {
    const uname = params[fields.indexOf('username')];
    const email = params[fields.indexOf('email')];
    if (store.users.find(u => u.username === uname || u.email === email)) {
      const err = new Error('Username or email already exists');
      err.code = '23505';
      throw err;
    }
  }

  const newRecord = buildRecord();
  store[table].push(newRecord);
  persist(table);
  return { lastID: newRecord.id, changes: 1 };
}

/* ── UPDATE ──────────────────────────────────────────── */
function execUpdate(q, params) {
  const table = (q.match(/UPDATE\s+(\w+)\s+SET/i) || [])[1];
  if (!table) return { changes: 0 };

  const sm = q.match(/SET\s+(.+?)\s+WHERE/i);
  const wm = q.match(/WHERE\s+(.+)$/i);
  if (!sm) return { changes: 0 };

  const setClause   = sm[1];
  const whereClause = wm ? wm[1] : null;
  const setParamCnt = (setClause.match(/\?/g) || []).length;
  const setParams   = params.slice(0, setParamCnt);
  const whereParams = params.slice(setParamCnt);

  let pi = 0;
  const ops = [];
  for (const raw of setClause.split(',')) {
    const assign = raw.trim();
    const eqIdx  = assign.indexOf('=');
    const field  = assign.slice(0, eqIdx).trim();
    const val    = assign.slice(eqIdx + 1).trim();

    if (val === '?') {
      ops.push({ field, type: 'set', value: setParams[pi++] });
    } else if (/\w+\s*\+\s*\?/.test(val)) {
      ops.push({ field, type: 'add', value: setParams[pi++] });
    } else if (/\w+\s*-\s*\?/.test(val)) {
      ops.push({ field, type: 'sub', value: setParams[pi++] });
    } else if (/CURRENT_TIMESTAMP|NOW\(\)/i.test(val)) {
      ops.push({ field, type: 'set', value: now() });
    } else {
      ops.push({ field, type: 'set', value: val.replace(/'/g, '') });
    }
  }

  let changes = 0;
  store[table] = (store[table] || []).map(record => {
    if (whereClause && !evalWhere(record, whereClause, whereParams)) return record;
    const updated = { ...record };
    for (const op of ops) {
      if      (op.type === 'set') updated[op.field] = op.value;
      else if (op.type === 'add') updated[op.field] = Number(record[op.field] || 0) + Number(op.value);
      else if (op.type === 'sub') updated[op.field] = Number(record[op.field] || 0) - Number(op.value);
    }
    changes++;
    return updated;
  });

  persist(table);
  return { lastID: null, changes };
}

/* ── DELETE ──────────────────────────────────────────── */
function execDelete(q, params) {
  const table = (q.match(/DELETE FROM\s+(\w+)/i) || [])[1];
  if (!table) return { changes: 0 };

  const wm     = q.match(/WHERE\s+(.+)$/i);
  const before = (store[table] || []).length;
  if (wm) {
    store[table] = (store[table] || []).filter(r => !evalWhere(r, wm[1], params));
  } else {
    store[table] = [];
  }
  persist(table);
  return { lastID: null, changes: before - store[table].length };
}

/* ── dispatcher ──────────────────────────────────────── */
function execSQL(sql, rawParams) {
  const q = normalise(sql);
  const p = toArray(rawParams);
  if (/^SELECT /i.test(q)) return execSelect(q, p);
  if (/^INSERT /i.test(q)) return execInsert(q, p);
  if (/^UPDATE /i.test(q)) return execUpdate(q, p);
  if (/^DELETE /i.test(q)) return execDelete(q, p);
  return null; // CREATE TABLE, setval, etc. — ignored
}

/* ── async db API (same interface as before) ─────────── */
function makeDb() {
  return {
    async get(sql, params) {
      const r = execSQL(sql, params);
      return Array.isArray(r) ? (r[0] || null) : (r || null);
    },
    async all(sql, params) {
      const r = execSQL(sql, params);
      return Array.isArray(r) ? r : [];
    },
    async run(sql, params) {
      const r = execSQL(sql, params);
      return r || { lastID: null, changes: 0 };
    },
    async exec() { /* no-op: CREATE TABLE statements not needed */ },
  };
}

/* ── init & seed ─────────────────────────────────────── */
let db;

async function initDatabase() {
  loadAll();
  db = makeDb();

  // Seed guest user
  if (!store.users.find(u => u.username === 'guest')) {
    store.users.push({
      id: nextId('users'), username: 'guest', email: 'guest@neurolib.local',
      password: 'guest', full_name: 'Guest User', is_admin: 0, created_at: now(),
    });
    persist('users');
  }

  // Seed categories
  if (store.categories.length === 0) {
    for (const name of ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography']) {
      store.categories.push({ id: nextId('categories'), name, created_at: now() });
    }
    persist('categories');
  }

  // Seed sample books
  if (store.books.length === 0) {
    for (const b of [
      { title: 'The Great Gatsby',      author: 'F. Scott Fitzgerald', category: 'Fiction',     price: 12.99, cover: '📕', description: 'A classic American novel set in the Jazz Age.',             stock: 10 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee',           category: 'Fiction',     price: 14.99, cover: '📗', description: 'Racial injustice and childhood innocence.',                stock: 8  },
      { title: 'Sapiens',               author: 'Yuval Noah Harari',    category: 'Non-Fiction', price: 18.99, cover: '📘', description: 'A brief history of humankind.',                            stock: 15 },
    ]) {
      store.books.push({ id: nextId('books'), ...b, rating: 0, pdf_data: null, pdf_url: null, created_at: now(), updated_at: now() });
    }
    persist('books');
  }

  console.log('Database initialized successfully');
  return db;
}

function getDb() { return db; }

module.exports = { initDatabase, getDb };
