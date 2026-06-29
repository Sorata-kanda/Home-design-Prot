const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['marble', 'gwalior_stone', 'moca_crema', 'white_stone', 'moulding', 'column', 'limestone', 'granite', 'other']
  },
  subcategory: { type: String, default: '' },
  description: { type: String, default: '' },
  
  // Pricing
  pricePerSqFt: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  // Images
  textureImage: {
    url: { type: String, required: true },
    publicId: { type: String },
    width: Number,
    height: Number
  },
  thumbnailImage: {
    url: { type: String },
    publicId: { type: String }
  },
  galleryImages: [{
    url: String,
    publicId: String,
    caption: String
  }],
  
  // Material properties for AI rendering
  finish: {
    type: String,
    enum: ['polished', 'honed', 'brushed', 'antique', 'natural', 'flamed'],
    default: 'polished'
  },
  reflectivity: { type: Number, min: 0, max: 1, default: 0.5 },
  roughness: { type: Number, min: 0, max: 1, default: 0.3 },
  
  // Application zones
  applicableZones: [{
    type: String,
    enum: ['floor', 'wall', 'ceiling', 'pillar', 'cornice', 'wainscoting', 'elevation', 'exterior', 'staircase']
  }],
  
  // Tags
  grade: { type: String, enum: ['interior', 'exterior', 'both'], default: 'both' },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
  
  // Preset options
  isNeoClassicalPreset: { type: Boolean, default: false },
  presetType: {
    type: String,
    enum: ['ionic_column', 'cornice', 'wainscoting', 'pilaster', 'arch', null],
    default: null
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', productSchema);
