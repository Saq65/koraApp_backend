// models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  purpose: { type: String, enum: ['email_change', 'mobile_change', 'password_reset'], required: true },
  newValue: { type: String, required: true }, // new email or mobile number
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL index 10 min
});
module.exports = mongoose.model('OTP', otpSchema);