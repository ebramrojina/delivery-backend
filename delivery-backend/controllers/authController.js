const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'name, phone, and password are required' });
    }

    if (role && !['customer', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this phone number already exists' });
    }

    const user = await User.create({ name, phone, role: role || 'customer', password });
    const token = generateToken(user._id);

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

module.exports = { register, login };
