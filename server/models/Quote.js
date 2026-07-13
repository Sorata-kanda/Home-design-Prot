const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  render: { type: mongoose.Schema.Types.ObjectId, ref: 'Render' },
  
  // Contact info (for guest submissions)
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: String,
  city: String,
  
  // Line items from selected SKUs
  lineItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String,
    sku: String,
    zone: String,
    estimatedArea: Number,   // sq ft
    pricePerSqFt: Number,
    lineTotal: Number
  }],
  
  totalEstimate: Number,
  
  // Status
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'converted', 'closed', 'won', 'lost'],
    default: 'new'
  },
  
  adminNotes: String,
  clientMessage: String,
  
  // Project details
  projectType: {
    type: String,
    enum: ['residential', 'commercial', 'hospitality', 'other'],
    default: 'residential'
  },
  projectTimeline: String,
  
}, { timestamps: true });

quoteSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);
