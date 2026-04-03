require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages
  .create({
    body: 'Test message from KORA',
    to: '+918821051303',          // your verified number
    from: process.env.TWILIO_PHONE
  })
  .then(msg => console.log('✅ Success! SID:', msg.sid))
  .catch(err => console.error('❌ Error:', err.code, err.message));