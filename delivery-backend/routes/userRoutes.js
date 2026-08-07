const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, saveFcmToken } = require('../controllers/userController');

// Admin only — used to list drivers for the assign-driver dropdown
router.get('/', protect, authorize('admin'), getUsers);

// Any authenticated user — saves their device's push notification token
router.put('/fcm-token', protect, saveFcmToken);

module.exports = router;
