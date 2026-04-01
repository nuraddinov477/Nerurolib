const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN_TTL_MS = parseInt(process.env.ADMIN_TOKEN_TTL_MS || `${12 * 60 * 60 * 1000}`, 10);
const activeAdminTokens = new Map();

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiresAt] of activeAdminTokens.entries()) {
    if (expiresAt <= now) activeAdminTokens.delete(token);
  }
}

function extractAdminToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return req.headers['x-admin-token'] || '';
}

function createAdminToken() {
  cleanupExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  activeAdminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL_MS);
  return token;
}

function isValidAdminToken(token) {
  cleanupExpiredTokens();
  if (!token) return false;
  const expiresAt = activeAdminTokens.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    activeAdminTokens.delete(token);
    return false;
  }
  return true;
}

function requiresAdmin(req, res, next) {
  const token = extractAdminToken(req);
  if (!isValidAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = {
  ADMIN_PASSWORD,
  ADMIN_TOKEN_TTL_MS,
  createAdminToken,
  extractAdminToken,
  isValidAdminToken,
  requiresAdmin,
};
