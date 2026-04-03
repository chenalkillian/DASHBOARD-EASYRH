const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
// Gère le préflight CORS pour /api/auth/login
router.options('/login', (req, res) => {
    res.sendStatus(204); // No Content
  });
  
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);  // route protégée test

module.exports = router;
