const { Router } = require('express');
const { ADMIN_PASSWORD, ADMIN_TOKEN_TTL_MS, createAdminToken } = require('../middleware/auth');

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password && password === ADMIN_PASSWORD) {
    const token = createAdminToken();
    return res.json({
      token,
      expires_in_ms: ADMIN_TOKEN_TTL_MS
    });
  }
  res.status(401).json({ error: 'Invalid password' });
});

module.exports = router;
