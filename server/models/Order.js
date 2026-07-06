const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  render: { type: mongoose.Schema.Types.ObjectId, ref: 'Render' },
  
  // Contact & Shipping info
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Line items
  lineItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String,
    sku: String,
    zone: String,
    estimatedArea: Number,   // sq ft
    pricePerSqFt: Number,
    lineTotal: Number
  }],
  
  totalAmount: { type: Number, required: true },
  
  // Payment status
  paymentMethod: {
    type: String,
    enum: ['simulated_upi', 'simulated_card', 'razorpay', 'pending'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  transactionId: String,
  
  // Fulfillment status
  fulfillmentStatus: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  
  adminNotes: String,
  
}, { timestamps: true });

orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
