const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true }, // e.g. "123 Main St, Dubai"
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'],
      default: 'created',
      required: true,
    },
    pickupAddress: {
      type: addressSchema,
      required: true,
    },
    deliveryAddress: {
      type: addressSchema,
      required: true,
    },
    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ driverId: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
