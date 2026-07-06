const mongoose = require('mongoose');

const renderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  
  // Original uploaded photo
  originalPhoto: {
    url: { type: String, required: true },
    publicId: String,
    width: Number,
    height: Number
  },
  
  // AI-generated render
  renderedPhoto: {
    url: String,
    publicId: String,
    width: Number,
    height: Number
  },
  
  // Products applied in this render
  appliedProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    zone: {
      type: String
    },
    coverage: Number // estimated sq ft
  }],
  
  // Segmentation data from AI
  segmentation: {
    zones: [{
      type: String,
      mask: String,     // base64 or URL of segmentation mask
      boundingBox: {
        x: Number, y: Number, width: Number, height: Number
      }
    }]
  },
  
  // Preset applied (if any)
  preset: {
    type: String,
    enum: ['ionic_columns', 'cornice', 'wainscoting', 'full_neoclassical', null],
    default: null
  },
  
  // Generation metadata
  generationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  generationPrompt: String,
  generationDuration: Number, // ms
  
  // Watermarked version
  watermarkedUrl: String,
  
  // Expiry (renders saved for 30 days)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  
  title: { type: String, default: 'My Room Visualization' },
  notes: String,
  isShared: { type: Boolean, default: false },
  shareToken: String,
  
}, { timestamps: true });

renderSchema.index({ user: 1, createdAt: -1 });
renderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Render', renderSchema);
