const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Render = require('../models/Render');
const Quote = require('../models/Quote');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/dashboard — stats overview
router.get('/dashboard', async (req, res) => {
  try {
    const [users, products, renders, quotes, newQuotes] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Product.countDocuments({ isAvailable: true }),
      Render.countDocuments(),
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'new' })
    ]);

    const recentQuotes = await Quote.find({ status: 'new' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('contactName contactPhone city totalEstimate createdAt')
      .lean();

    res.json({ stats: { users, products, renders, quotes, newQuotes }, recentQuotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(50).select('-password').lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/seed — seed sample products (dev/setup)
router.post('/seed', async (req, res) => {
  try {
    const existing = await Product.countDocuments();
    if (existing > 0) return res.json({ message: 'Products already seeded', count: existing });

    const sampleProducts = [
      {
        sku: 'MRB-001',
        name: 'Italian Carrara White Marble',
        category: 'marble',
        pricePerSqFt: 450,
        finish: 'polished',
        reflectivity: 0.85,
        roughness: 0.1,
        applicableZones: ['floor', 'wall', 'pillar'],
        grade: 'both',
        isFeatured: true,
        textureImage: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
        tags: ['luxury', 'white', 'classic', 'marble']
      },
      {
        sku: 'GWL-001',
        name: 'Gwalior Beige Sandstone',
        category: 'gwalior_stone',
        pricePerSqFt: 85,
        finish: 'honed',
        reflectivity: 0.2,
        roughness: 0.7,
        applicableZones: ['wall', 'floor', 'wainscoting', 'elevation', 'exterior'],
        grade: 'both',
        isFeatured: true,
        textureImage: { url: 'https://images.unsplash.com/photo-1509699980850-78c7b1f7d7de?w=800' },
        tags: ['traditional', 'beige', 'indian', 'wainscoting']
      },
      {
        sku: 'MOC-001',
        name: 'Moca Crema Limestone',
        category: 'moca_crema',
        pricePerSqFt: 320,
        finish: 'honed',
        reflectivity: 0.35,
        roughness: 0.45,
        applicableZones: ['floor', 'wall', 'staircase'],
        grade: 'interior',
        isFeatured: true,
        textureImage: { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800' },
        tags: ['cream', 'warm', 'european', 'limestone']
      },
      {
        sku: 'MLD-001',
        name: 'White PU Cornice Moulding – Classic',
        category: 'moulding',
        pricePerSqFt: 180,
        finish: 'polished',
        reflectivity: 0.4,
        roughness: 0.2,
        applicableZones: ['ceiling', 'cornice'],
        grade: 'interior',
        isNeoClassicalPreset: true,
        presetType: 'cornice',
        textureImage: { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800' },
        tags: ['cornice', 'moulding', 'neoclassical', 'white', 'ceiling']
      },
      {
        sku: 'COL-001',
        name: 'Ionic Column – White Marble Composite',
        category: 'column',
        pricePerSqFt: 2200,
        finish: 'polished',
        reflectivity: 0.75,
        roughness: 0.15,
        applicableZones: ['pillar'],
        grade: 'both',
        isNeoClassicalPreset: true,
        presetType: 'ionic_column',
        textureImage: { url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800' },
        tags: ['column', 'ionic', 'neoclassical', 'luxury', 'grand']
      },
      {
        sku: 'GRN-001',
        name: 'Black Galaxy Granite',
        category: 'granite',
        pricePerSqFt: 220,
        finish: 'polished',
        reflectivity: 0.9,
        roughness: 0.05,
        applicableZones: ['floor', 'wall'],
        grade: 'both',
        textureImage: { url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800' },
        tags: ['black', 'granite', 'modern', 'luxury']
      }
    ];

    await Product.insertMany(sampleProducts);
    res.json({ message: 'Sample products seeded', count: sampleProducts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
