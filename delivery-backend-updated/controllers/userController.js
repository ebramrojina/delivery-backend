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

module.exports = { getUsers };
