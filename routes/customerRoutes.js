const express = require('express');

const {
  getProfile,
   requestEmailOtp, verifyEmailOtp, requestMobileOtp, verifyMobileOtp,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/customerController');

const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();


// ─── PROFILE ─────────────────────────────────────────────

// Get logged-in customer profile
router.get(
  '/profile',
  protect,
  restrictTo('customer'),
  getProfile
);


router.put('/profile', protect, updateProfile);
router.post('/profile/request-email-otp', protect, requestEmailOtp);
router.post('/profile/verify-email-otp', protect, verifyEmailOtp);
router.post('/profile/request-mobile-otp', protect, requestMobileOtp);
router.post('/profile/verify-mobile-otp', protect, verifyMobileOtp);

// ─── ADDRESSES ───────────────────────────────────────────

// Add address
router.post(
  '/addresses',
  protect,
  restrictTo('customer'),
  addAddress
);

// Update address
router.put(
  '/addresses/:addressId',
  protect,
  restrictTo('customer'),
  updateAddress
);

// Delete address
router.delete(
  '/addresses/:addressId',
  protect,
  restrictTo('customer'),
  deleteAddress
);

// Set default address
router.put(
  '/addresses/:addressId/default',
  protect,
  restrictTo('customer'),
  setDefaultAddress
);


module.exports = router;