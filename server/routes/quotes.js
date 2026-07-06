const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Product = require('../models/Product');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// POST /api/quotes — submit a quote request
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { contactName, contactPhone, contactEmail, city, lineItems, renderId, clientMessage, projectType } = req.body;
    
    if (!contactName || !contactPhone) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    // Enrich line items with current pricing
    const enrichedItems = await Promise.all((lineItems || []).map(async (item) => {
      const product = await Product.findById(item.productId).lean();
      if (!product) return null;
      return {
        product: product._id,
        productName: product.name,
        sku: product.sku,
        zone: item.zone,
        estimatedArea: item.estimatedArea || 0,
        pricePerSqFt: product.pricePerSqFt,
        lineTotal: (item.estimatedArea || 0) * product.pricePerSqFt
      };
    }));

    const validItems = enrichedItems.filter(Boolean);
    const totalEstimate = validItems.reduce((sum, i) => sum + i.lineTotal, 0);

    const quote = await Quote.create({
      user: req.user?._id,
      render: renderId || undefined,
      contactName,
      contactPhone,
      contactEmail,
      city,
      lineItems: validItems,
      totalEstimate,
      clientMessage,
      projectType: projectType || 'residential'
    });

    res.status(201).json({ quote, message: 'Quote request submitted. Our team will call you within 24 hours.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quotes/mine — user's own quotes
router.get('/mine', protect, async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id })
      .populate('lineItems.product', 'name sku')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ quotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: GET all quotes
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    
    const quotes = await Quote.find(filter)
      .populate('user', 'name email phone')
      .populate('lineItems.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    
    const total = await Quote.countDocuments(filter);
    res.json({ quotes, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: PATCH quote status
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
