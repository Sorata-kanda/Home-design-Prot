const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadTexture } = require('../middleware/upload');

// GET /api/products — public product listing
router.get('/', async (req, res) => {
  try {
    const { category, grade, zone, search, featured } = req.query;
    const filter = { isAvailable: true };
    
    if (category) filter.category = category;
    if (grade) filter.grade = { $in: [grade, 'both'] };
    if (zone) filter.applicableZones = zone;
    if (featured === 'true') filter.isFeatured = true;
    if (search) filter.$text = { $search: search };
    
    const products = await Product.find(filter)
      .select('sku name category pricePerSqFt finish grade applicableZones textureImage thumbnailImage tags isFeatured isNeoClassicalPreset presetType')
      .sort({ isFeatured: -1, category: 1, name: 1 })
      .lean();
    
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isAvailable: true });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/presets — neoclassical presets
router.get('/presets', async (req, res) => {
  try {
    const presets = await Product.find({ isNeoClassicalPreset: true, isAvailable: true }).lean();
    res.json({ presets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes below — require auth + admin role

// POST /api/products — create product
router.post('/', protect, adminOnly, uploadTexture, async (req, res) => {
  try {
    const productData = { ...req.body };
    
    if (req.files?.texture?.[0]) {
      productData.textureImage = {
        url: req.files.texture[0].path,
        publicId: req.files.texture[0].filename
      };
    }
    if (req.files?.thumbnail?.[0]) {
      productData.thumbnailImage = {
        url: req.files.thumbnail[0].path,
        publicId: req.files.thumbnail[0].filename
      };
    }
    if (req.files?.gallery) {
      productData.galleryImages = req.files.gallery.map(f => ({
        url: f.path,
        publicId: f.filename
      }));
    }
    
    if (typeof productData.applicableZones === 'string') {
      productData.applicableZones = JSON.parse(productData.applicableZones);
    }
    if (typeof productData.tags === 'string') {
      productData.tags = JSON.parse(productData.tags);
    }
    
    const product = await Product.create(productData);
    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/products/:id — update product
router.patch('/:id', protect, adminOnly, uploadTexture, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (req.files?.texture?.[0]) {
      updates.textureImage = {
        url: req.files.texture[0].path,
        publicId: req.files.texture[0].filename
      };
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product removed from catalogue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
