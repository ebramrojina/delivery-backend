const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendNotificationToUser, sendNotificationToRole } = require('../services/notificationService');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/orders  (customer)
const createOrder = async (req, res) => {
  try {
    const { pickupAddress, deliveryAddress, branchId, branchName, items, orderTotal } = req.body;

    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({ message: 'pickupAddress and deliveryAddress are required' });
    }
    if (!branchId || !branchName) {
      return res.status(400).json({ message: 'branchId and branchName are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items must be a non-empty array' });
    }
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ message: 'Each item requires name, price, and quantity' });
      }
    }
    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return res.status(400).json({ message: 'orderTotal must be a non-negative number' });
    }

    const order = await Order.create({
      customerId: req.user._id,
      branchId,
      branchName,
      items,
      orderTotal,
      pickupAddress,
      deliveryAddress,
      status: 'created',
    });

    // Let admins/branch managers know a new order needs a driver assigned.
    sendNotificationToRole(
      'admin',
      'new_order',
      { orderId: order._id.toString(), type: 'new_order' }
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

// GET /api/orders/:id  (customer/driver/admin - ownership enforced)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid order id' });

    const order = await Order.findById(id)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { role, _id } = req.user;
    const isOwnerCustomer = role === 'customer' && order.customerId._id.equals(_id);
    const isAssignedDriver = role === 'driver' && order.driverId && order.driverId._id.equals(_id);
    const isAdmin = role === 'admin';

    if (!isOwnerCustomer && !isAssignedDriver && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you do not have access to this order' });
    }

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

// GET /api/orders/customer/:customerId  (customer sees own orders, admin sees any)
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isValidId(customerId)) return res.status(400).json({ message: 'Invalid customer id' });

    if (req.user.role === 'customer' && !req.user._id.equals(customerId)) {
      return res.status(403).json({ message: 'Forbidden: cannot view another customer\'s orders' });
    }

    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer orders', error: err.message });
  }
};

// GET /api/orders/driver/:driverId  (driver sees own assigned orders, admin sees any)
const getDriverOrders = async (req, res) => {
  try {
    const { driverId } = req.params;
    if (!isValidId(driverId)) return res.status(400).json({ message: 'Invalid driver id' });

    if (req.user.role === 'driver' && !req.user._id.equals(driverId)) {
      return res.status(403).json({ message: 'Forbidden: cannot view another driver\'s orders' });
    }

    const orders = await Order.find({ driverId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch driver orders', error: err.message });
  }
};

// GET /api/orders  (admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// PUT /api/orders/:id/assign  (admin only)
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid order id' });
    if (!driverId || !isValidId(driverId)) {
      return res.status(400).json({ message: 'A valid driverId is required' });
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'created') {
      return res.status(409).json({ message: `Cannot assign driver: order status is '${order.status}'` });
    }

    order.driverId = driverId;
    order.status = 'assigned';
    order.assignedAt = new Date();
    await order.save();

    sendNotificationToUser(
      driverId,
      'order_assigned',
      { orderId: order._id.toString(), type: 'order_assigned' }
    );

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign driver', error: err.message });
  }
};

// PUT /api/orders/:id/pickup  (assigned driver only)
const markPickedUp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid order id' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.driverId || !order.driverId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the assigned driver for this order' });
    }

    if (order.status !== 'assigned') {
      return res.status(409).json({ message: `Cannot mark picked up: order status is '${order.status}'` });
    }

    order.status = 'picked_up';
    order.pickedUpAt = new Date();
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order to picked up', error: err.message });
  }
};

// PUT /api/orders/:id/out-for-delivery  (assigned driver only)
const markOutForDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid order id' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.driverId || !order.driverId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the assigned driver for this order' });
    }

    if (order.status !== 'picked_up') {
      return res.status(409).json({ message: `Cannot mark out for delivery: order status is '${order.status}'` });
    }

    order.status = 'out_for_delivery';
    order.outForDeliveryAt = new Date();
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order to out for delivery', error: err.message });
  }
};

// PUT /api/orders/:id/deliver  (assigned driver only)
const markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid order id' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.driverId || !order.driverId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you are not the assigned driver for this order' });
    }

    if (!['picked_up', 'out_for_delivery'].includes(order.status)) {
      return res.status(409).json({ message: `Cannot mark delivered: order status is '${order.status}'` });
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order to delivered', error: err.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getDriverOrders,
  getAllOrders,
  assignDriver,
  markPickedUp,
  markOutForDelivery,
  markDelivered,
};
