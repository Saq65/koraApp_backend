const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  fullName: { type: String, required: true },
  dob: Date,
  email: String,
  profilePhoto: String,
  // ... any other customer specific fields
  createdAt: { type: Date, default: Date.now },
  addresses: [{
  label: String,        // "Home", "Office"
  addressLine: String,
  city: String,
  pincode: String,
  coordinates: [Number] // [lng, lat]
}],
defaultAddressId: mongoose.Schema.Types.ObjectId,
phone: String,
});

module.exports = mongoose.model('Customer', CustomerSchema);