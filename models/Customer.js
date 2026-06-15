const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  accountId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Account', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  dob: Date,
  profilePhoto: String,
  addresses: [{
    label: String,
    addressLine: String,
    city: String,
    pincode: String,
    coordinates: [Number]
  }],
  defaultAddressId: mongoose.Schema.Types.ObjectId,
  phone: String,
  expoPushToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', CustomerSchema);