const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers } = require('../controllers/userController');

// Admin only — used to list drivers for the assign-driver dropdown
router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;
