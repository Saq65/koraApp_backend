const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your SMTP
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmailOtp = async (to, otp) => {
  await transporter.sendMail({
    from: `"Kora App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset OTP',
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });
};
module.exports = sendEmailOtp;