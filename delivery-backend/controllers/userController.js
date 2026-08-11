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
// Saves the calling user's Firebase Cloud Messaging device token, and
// optionally their current app language, so the backend can push
// notifications to them in the right language.
const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken, locale } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'fcmToken is required' });
    }

    const update = { fcmToken };
    if (locale === 'en' || locale === 'ar') {
      update.locale = locale;
    }

    await User.findByIdAndUpdate(req.user._id, update);
    res.status(200).json({ message: 'Token saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save token', error: err.message });
  }
};

module.exports = { getUsers, saveFcmToken };
