require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./db/database');
const booksRouter = require('./routes/books');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const adminRouter = require('./routes/admin');
const aiRouter = require('./routes/ai');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.NODE_PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (process.env.NODE_ENV === 'production' ? false : '*');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://www.gutenberg.org', 'https://gutenberg.org'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
}));

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Production: React build ni serve qilish
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Node.js server is running' }));
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);

// Production: barcha boshqa so'rovlar React ga
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
}
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
