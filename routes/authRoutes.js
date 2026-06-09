const express = require('express');
const {
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  logout
} = require('../controllers/authController');
const { authLimiter, resetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);                       // changed
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/verify-reset-otp', resetLimiter, verifyResetOtp);
router.post('/reset-password', resetLimiter, resetPassword);
router.post('/logout', logout);

module.exports = router;