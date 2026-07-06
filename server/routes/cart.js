const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Get cart for current user
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ cart });
  } catch (err) {
    require('fs').appendFileSync('cart_error.log', '\n[' + new Date().toISOString() + '] ' + (err.stack || err.message));
    res.status(500).json({ error: err.message });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity = 1, zone = 'General' } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(item => {
      if (!item || !item.product) return false;
      const pIdStr = String(item.product._id || item.product).trim();
      return pIdStr === String(productId).trim();
    });

    if (existingItem) {
      await Cart.updateOne(
        { _id: cart._id, 'items._id': existingItem._id },
        { $inc: { 'items.$.quantity': Number(quantity) } }
      );
    } else {
      await Cart.updateOne(
        { _id: cart._id },
        { $push: { items: { product: productId, quantity: Number(quantity), zone, priceAtAddition: product.pricePerSqFt } } }
      );
    }

    // Refetch clean cart to send back populated
    const updatedCart = await Cart.findById(cart._id).populate('items.product');
    
    res.json({ cart: updatedCart });
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product');

    res.json({ cart });
  } catch (err) {
    require('fs').appendFileSync('cart_error.log', '\n[' + new Date().toISOString() + '] ' + (err.stack || err.message));
    res.status(500).json({ error: err.message });
  }
});

// Clear cart
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared', cart });
  } catch (err) {
    require('fs').appendFileSync('cart_error.log', '\n[' + new Date().toISOString() + '] ' + (err.stack || err.message));
    res.status(500).json({ error: err.message });
  }
});

// Update item quantity
router.patch('/update/:itemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in cart' });

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.json({ cart });
  } catch (err) {
    require('fs').appendFileSync('cart_error.log', '\n[' + new Date().toISOString() + '] ' + (err.stack || err.message));
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
