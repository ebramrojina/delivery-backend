const User = require('../models/User');

// GET /api/users?role=driver  (admin only)
// Lists users, optionally filtered by role. Used by the admin app to
// populate the "assign driver" dropdown.
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role) {
      if (!['customer', 'driver', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role filter' });
      }
      filter.role = role;
    }

    const users = await User.find(filter).select('name phone role').sort({ name: 1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// PUT /api/users/fcm-token  (any authenticated user)
// Saves the calling user's Firebase Cloud Messaging device token so the
// backend can push notifications to them (e.g. a driver getting a new
// order assignment).
const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'fcmToken is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.status(200).json({ message: 'Token saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save token', error: err.message });
  }
};

module.exports = { getUsers, saveFcmToken };
