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
    coordinates: [Number] // [lng, lat]
  }],
  defaultAddressId: mongoose.Schema.Types.ObjectId,
  phone: String,  // optional – if you want separate phone number
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Customer', CustomerSchema);