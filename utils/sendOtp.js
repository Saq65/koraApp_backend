require('dotenv').config();   // MUST be first line
const twilio = require('twilio');
const OTP = require('../models/OTP');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Log to verify env vars are loaded (remove after debugging)
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ loaded' : '❌ missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ loaded' : '❌ missing');
console.log('TWILIO_PHONE:', process.env.TWILIO_PHONE);

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOtp = async (mobile) => {
  const otp = generateOtp();
  const message = `Your KORA verification code is: ${otp}. Valid for 10 minutes.`;

  try {
    await client.messages.create({
      body: message,
      to: mobile,
      from: process.env.TWILIO_PHONE
    });

    await OTP.findOneAndUpdate(
      { mobile },
      { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true }
    );

    console.log(`OTP sent to ${mobile}: ${otp}`);
    return otp;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = sendOtp;