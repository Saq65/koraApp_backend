const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Rider = require('../models/Rider');
const ServiceProvider = require('../models/ServiceProvider');
const OTP = require('../models/OTP');
const sendOtpSms = require('../utils/sendOtp');   // your existing SMS util
const sendEmailOtp = require('../utils/sendEmail');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (accountId, role) => {
  return jwt.sign({ id: accountId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const createProfile = async (accountId, role, profileData) => {
  switch (role) {
    case 'customer':
      return await Customer.create({ accountId, ...profileData });
    case 'rider':
      return await Rider.create({ accountId, ...profileData });
    case 'serviceProvider':
      return await ServiceProvider.create({ accountId, ...profileData });
    default:
      throw new Error('Invalid role');
  }
};

// ----------------------------------------------------------------------
// 1. REGISTRATION (email, mobile, password, role, profile data)
// ----------------------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { email, mobile, password, role, ...profileData } = req.body;

    if (!email || !mobile || !password || !role) {
      return res.status(400).json({ error: 'Email, mobile, password and role are required' });
    }

    // Check if email already exists
    const existingEmail = await Account.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if mobile already exists
    const existingMobile = await Account.findOne({ mobile });
    if (existingMobile) {
      return res.status(409).json({ error: 'Mobile already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await Account.create({
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      role,
      isVerified: true
    });

    await createProfile(account._id, role, profileData);

    const token = generateToken(account._id, role);
    res.status(201).json({ token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------------------------
// 2. LOGIN WITH EMAIL OR MOBILE + PASSWORD
// ----------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR mobile
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/mobile and password required' });
    }

    let account;
    const isEmail = identifier.includes('@');
    if (isEmail) {
      account = await Account.findOne({ email: identifier.toLowerCase() });
    } else {
      account = await Account.findOne({ mobile: identifier });
    }

    if (!account) {
      return res.status(401).json({ error: 'Invalid email/mobile or password' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/mobile or password' });
    }

    const token = generateToken(account._id, account.role);
    res.json({ token, role: account.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------------------------
// 3. FORGOT PASSWORD – Send OTP to email or mobile
// ----------------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or mobile is required' });
    }

    const isEmail = identifier.includes('@');
    let account;

    if (isEmail) {
      account = await Account.findOne({ email: identifier.toLowerCase() });
    } else {
      account = await Account.findOne({ mobile: identifier });
    }

    if (!account) {
      return res.status(404).json({ error: 'No account found with this email or mobile' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (overwrite any existing for same contact & purpose)
    await OTP.findOneAndUpdate(
      { contact: identifier, purpose: 'reset' },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP
    if (isEmail) {
      await sendEmailOtp(identifier, otp);
    } else {
      await sendOtpSms(identifier, 'reset'); // assumes your SMS util accepts mobile and purpose
    }

    res.json({ message: `OTP sent to your ${isEmail ? 'email' : 'mobile'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------------------------
// 4. VERIFY RESET OTP
// ----------------------------------------------------------------------
exports.verifyResetOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP required' });
    }

    const otpRecord = await OTP.findOne({ contact: identifier, otp, purpose: 'reset' });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate short-lived reset token
    const resetToken = jwt.sign(
      { identifier, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------------------------
// 5. RESET PASSWORD (using resetToken)
// ----------------------------------------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    const { identifier } = decoded;
    let account;

    if (identifier.includes('@')) {
      account = await Account.findOne({ email: identifier.toLowerCase() });
    } else {
      account = await Account.findOne({ mobile: identifier });
    }

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedPassword;
    await account.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------------------------
// 6. LOGOUT (optional)
// ----------------------------------------------------------------------
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};