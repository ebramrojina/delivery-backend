const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getDriverOrders,
  getAllOrders,
  assignDriver,
  markPickedUp,
  markOutForDelivery,
  markDelivered,
} = require('../controllers/orderController');

// All order routes require a valid JWT
router.use(protect);

// Admin
router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/assign', authorize('admin'), assignDriver);

// Customer
router.post('/', authorize('customer'), createOrder);
router.get('/customer/:customerId', authorize('customer', 'admin'), getCustomerOrders);

// Driver
router.get('/driver/:driverId', authorize('driver', 'admin'), getDriverOrders);
router.put('/:id/pickup', authorize('driver'), markPickedUp);
router.put('/:id/out-for-delivery', authorize('driver'), markOutForDelivery);
router.put('/:id/deliver', authorize('driver'), markDelivered);

// Shared (ownership checked inside controller)
router.get('/:id', getOrderById);

module.exports = router;
