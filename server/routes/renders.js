const express = require('express');
const router = express.Router();
const axios = require('axios');
const Render = require('../models/Render');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/renders — get user's renders
router.get('/', protect, async (req, res) => {
  try {
    const renders = await Render.find({ user: req.user._id })
      .populate('appliedProducts.product', 'name sku category pricePerSqFt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ renders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/renders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const render = await Render.findOne({ _id: req.params.id, user: req.user._id })
      .populate('appliedProducts.product')
      .lean();
    if (!render) return res.status(404).json({ error: 'Render not found' });
    res.json({ render });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/renders/:id/share — create shareable link
router.post('/:id/share', protect, async (req, res) => {
  try {
    const shareToken = uuidv4();
    const render = await Render.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isShared: true, shareToken },
      { new: true }
    );
    if (!render) return res.status(404).json({ error: 'Render not found' });
    res.json({ shareUrl: `${process.env.CLIENT_URL}/view/${shareToken}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/renders/shared/:token — public view
router.get('/shared/:token', async (req, res) => {
  try {
    const render = await Render.findOne({ shareToken: req.params.token, isShared: true })
      .populate('appliedProducts.product', 'name sku textureImage category finish pricePerSqFt')
      .lean();
    if (!render) return res.status(404).json({ error: 'Visualization not found' });
    res.json({ render });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/renders/download — proxy download to bypass CORS (public)
router.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // SSRF Validation: Only allow streaming from Cloudinary
    if (!url.startsWith('https://res.cloudinary.com/')) {
      return res.status(400).json({ error: 'Invalid download source domain' });
    }

    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', 'attachment; filename="arteffects-visualization.jpg"');
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');

    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// DELETE /api/renders/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Render.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Render deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
