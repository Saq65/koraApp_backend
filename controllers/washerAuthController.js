// controllers/washerAuthController.js
const Washer = require("../models/Washer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id, role: "washer" }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/washer/auth/register
// washerAuthController.js mein register function temporarily debug karo:
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    console.log('Register called:', { name, phone });

    const exists = await Washer.findOne({ phone });
    console.log('Exists:', exists ? 'yes' : 'no');

    if (exists) return res.status(400).json({ success: false, message: "Phone already registered" });

    console.log('Creating washer...');
    const washer = await Washer.create({ name, phone, password });
    console.log('Washer created:', washer._id);

    const token = generateToken(washer._id);
    res.status(201).json({ success: true, token, washer: { id: washer._id, name: washer.name, phone: washer.phone } });
  } catch (err) {
    console.log('Register error:', err.stack); // ← stack trace
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/washer/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const washer = await Washer.findOne({ phone });
    if (!washer)
      return res.status(404).json({ success: false, message: "Washer not found" });

    const isMatch = await bcrypt.compare(password, washer.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(washer._id);

    res.json({
      success: true,
      token,
      washer: { id: washer._id, name: washer.name, phone: washer.phone },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/washer/auth/me
exports.getMe = async (req, res) => {
  try {
    const washer = await Washer.findById(req.user.id).select("-password");
    res.json({ success: true, washer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/washer/auth/push-token
exports.savePushToken = async (req, res) => {
  try {
    await Washer.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};