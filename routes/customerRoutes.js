const express = require('express');
const Customer = require('../models/Customer');

const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateEmail
} = require('../controllers/customerController');

const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ─── PROFILE ─────────────────────────────────────────────

router.get('/profile', protect, restrictTo('customer'), getProfile);
router.put('/profile', protect, restrictTo('customer'), updateProfile);
router.put('/profile/email', protect, restrictTo('customer'), updateEmail);

// ─── ADDRESSES ───────────────────────────────────────────

router.post('/addresses', protect, restrictTo('customer'), addAddress);
router.put('/addresses/:addressId', protect, restrictTo('customer'), updateAddress);
router.delete('/addresses/:addressId', protect, restrictTo('customer'), deleteAddress);
router.put('/addresses/:addressId/default', protect, restrictTo('customer'), setDefaultAddress);

// ─── PUSH TOKEN ──────────────────────────────────────────

router.patch('/push-token', protect, async (req, res) => {
  await Customer.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken });
  res.json({ success: true });
});

module.exports = router;