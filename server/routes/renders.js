const express = require('express');
const router = express.Router();
const Render = require('../models/Render');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/renders — get user's renders
router.get('/', protect, async (req, res) => {
  try {
    const renders = await Render.find({ user: req.user._id })
      .populate('appliedProducts.product', 'name sku category pricePerSqFt')
      .sort({ createdAt: -1 });
    res.json({ renders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/renders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const render = await Render.findOne({ _id: req.params.id, user: req.user._id })
      .populate('appliedProducts.product');
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
      .populate('appliedProducts.product', 'name sku pricePerSqFt category');
    if (!render) return res.status(404).json({ error: 'Visualization not found' });
    res.json({ render });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
