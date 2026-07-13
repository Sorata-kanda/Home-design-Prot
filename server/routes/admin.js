const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Render = require('../models/Render');
const Quote = require('../models/Quote');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─────────────────────────────────────────
// GET /api/admin/dashboard — stats overview
// ─────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const [users, products, renders, quotes, newQuotes, totalOrders] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            Product.countDocuments({ isAvailable: true }),
            Render.countDocuments(),
            Quote.countDocuments(),
            Quote.countDocuments({ status: 'new' }),
            Order.countDocuments(),
        ]);

        // Revenue KPIs
        const revenueAgg = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        // Orders by status counts
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } },
        ]);

        const recentQuotes = await Quote.find({ status: 'new' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('contactName contactPhone city totalEstimate createdAt status')
            .lean();

        res.json({
            stats: { users, products, renders, quotes, newQuotes, totalOrders, totalRevenue },
            ordersByStatus,
            recentQuotes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/admin/analytics — chart data
// ─────────────────────────────────────────
router.get('/analytics', async (req, res) => {
    try {
        // Last 7 days daily revenue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo, $lte: today }, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Build full 7-day array (fill missing days with 0)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyRevenue.find((r) => r._id === dateStr);
            last7Days.push({
                date: dateStr,
                label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                revenue: found?.revenue || 0,
                orders: found?.orders || 0,
            });
        }

        // Last 6 months monthly revenue
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Orders by fulfillment status (for donut)
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } },
        ]);

        // Top products by order frequency
        const topProducts = await Order.aggregate([
            { $unwind: '$lineItems' },
            { $group: { _id: '$lineItems.productName', count: { $sum: 1 }, revenue: { $sum: '$lineItems.lineTotal' } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        res.json({ last7Days, monthlyRevenue, ordersByStatus, topProducts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/admin/users — all users
// ─────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('-password')
            .lean();
        const total = await User.countDocuments(filter);
        res.json({ users, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/users/:id — update role
router.patch('/users/:id', async (req, res) => {
    try {
        const { role, isVerified } = req.body;
        const update = {};
        if (role) update.role = role;
        if (typeof isVerified === 'boolean') update.isVerified = isVerified;
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/admin/renders — all renders
// ─────────────────────────────────────────
router.get('/renders', async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const renders = await Render.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('user', 'name email')
            .lean();
        const total = await Render.countDocuments();
        res.json({ renders, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/renders/:id
router.delete('/renders/:id', async (req, res) => {
    try {
        await Render.findByIdAndDelete(req.params.id);
        res.json({ message: 'Render deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// GET /api/admin/categories — product categories summary
// ─────────────────────────────────────────
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$pricePerSqFt' } } },
            { $sort: { count: -1 } },
        ]);
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// Coupons (in-memory store - no model needed)
// GET/POST/DELETE /api/admin/coupons
// ─────────────────────────────────────────
let _coupons = [
    { id: 'c1', code: 'WELCOME10', discount: 10, type: 'percent', active: true, uses: 0, expiresAt: '2026-12-31' },
    { id: 'c2', code: 'FLAT500', discount: 500, type: 'flat', active: true, uses: 3, expiresAt: '2026-09-30' },
];

router.get('/coupons', (req, res) => res.json({ coupons: _coupons }));

router.post('/coupons', (req, res) => {
    const { code, discount, type = 'percent', expiresAt } = req.body;
    if (!code || !discount) return res.status(400).json({ error: 'Code and discount are required' });
    const newCoupon = { id: Date.now().toString(), code: code.toUpperCase(), discount: Number(discount), type, active: true, uses: 0, expiresAt: expiresAt || '' };
    _coupons.push(newCoupon);
    res.status(201).json({ coupon: newCoupon });
});

router.patch('/coupons/:id', (req, res) => {
    const idx = _coupons.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });
    _coupons[idx] = { ..._coupons[idx], ...req.body };
    res.json({ coupon: _coupons[idx] });
});

router.delete('/coupons/:id', (req, res) => {
    _coupons = _coupons.filter(c => c.id !== req.params.id);
    res.json({ message: 'Coupon deleted' });
});

// ─────────────────────────────────────────
// POST /api/admin/seed
// ─────────────────────────────────────────
router.post('/seed', async (req, res) => {
    try {
        const results = {};
        
        // 1. Seed Products if they don't exist
        let products = await Product.find();
        if (products.length === 0) {
            const sampleProducts = [
                { sku: 'MRB-001', name: 'Italian Carrara White Marble', category: 'marble', pricePerSqFt: 450, finish: 'polished', reflectivity: 0.85, roughness: 0.1, applicableZones: ['floor', 'wall', 'pillar'], grade: 'both', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' }, tags: ['luxury', 'white', 'classic', 'marble'] },
                { sku: 'GWL-001', name: 'Gwalior Beige Sandstone', category: 'gwalior_stone', pricePerSqFt: 85, finish: 'honed', reflectivity: 0.2, roughness: 0.7, applicableZones: ['wall', 'floor', 'wainscoting', 'elevation', 'exterior'], grade: 'both', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1509699980850-78c7b1f7d7de?w=800' }, tags: ['traditional', 'beige', 'indian', 'wainscoting'] },
                { sku: 'MOC-001', name: 'Moca Crema Limestone', category: 'moca_crema', pricePerSqFt: 320, finish: 'honed', reflectivity: 0.35, roughness: 0.45, applicableZones: ['floor', 'wall', 'staircase'], grade: 'interior', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800' }, tags: ['cream', 'warm', 'european', 'limestone'] },
                { sku: 'GRN-001', name: 'Black Galaxy Granite', category: 'granite', pricePerSqFt: 220, finish: 'polished', reflectivity: 0.80, roughness: 0.15, applicableZones: ['floor', 'wall'], grade: 'both', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800' }, tags: ['luxury', 'black', 'granite'] },
                { sku: 'MLD-001', name: 'Neoclassical Cornice Moulding', category: 'moulding', pricePerSqFt: 180, finish: 'polished', reflectivity: 0.3, roughness: 0.5, applicableZones: ['cornice', 'wall'], grade: 'interior', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800' }, tags: ['moulding', 'classic'] },
                { sku: 'COL-001', name: 'Classic Greek Column', category: 'column', pricePerSqFt: 950, finish: 'natural', reflectivity: 0.1, roughness: 0.8, applicableZones: ['pillar'], grade: 'both', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1563911302283-d2bc1d9e6770?w=800' }, tags: ['column', 'pillar', 'stone'] },
                { sku: 'LMS-001', name: 'French Travertine Stone', category: 'limestone', pricePerSqFt: 290, finish: 'honed', reflectivity: 0.4, roughness: 0.4, applicableZones: ['floor', 'wall'], grade: 'both', isFeatured: true, textureImage: { url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800' }, tags: ['limestone', 'travertine'] }
            ];
            products = await Product.insertMany(sampleProducts);
            results.products = sampleProducts.length;
        } else {
            results.products = 'already exists (' + products.length + ')';
        }

        // 2. Seed Users
        let sampleUser1 = await User.findOne({ email: 'client@dsyn.com' });
        if (!sampleUser1) {
            sampleUser1 = await User.create({ name: 'Jane Architect', email: 'client@dsyn.com', password: 'Password@123', role: 'client', isVerified: true });
        }
        let sampleUser2 = await User.findOne({ email: 'bob@dsyn.com' });
        if (!sampleUser2) {
            sampleUser2 = await User.create({ name: 'Bob Builder', email: 'bob@dsyn.com', password: 'Password@123', role: 'client', isVerified: true });
        }
        let sampleUser3 = await User.findOne({ email: 'alice@dsyn.com' });
        if (!sampleUser3) {
            sampleUser3 = await User.create({ name: 'Alice Designer', email: 'alice@dsyn.com', password: 'Password@123', role: 'client', isVerified: true });
        }
        results.users = 'seeded/verified';

        const clientUsers = [sampleUser1, sampleUser2, sampleUser3];

        // 3. Clear and seed Orders, Quotes, Renders, Notifications to populate graphs
        await Order.deleteMany({});
        await Quote.deleteMany({});
        await Render.deleteMany({});
        const NotificationModel = require('../models/Notification');
        await NotificationModel.deleteMany({});

        // Seed Renders
        const renderList = [];
        const renderTitles = ['Living Room Floor Render', 'Neo-Classical Elevation', 'Modern Kitchen Counter', 'Master Bath Wainscoting', 'Lobby Pillars Visualization'];
        for (let i = 0; i < 8; i++) {
            const user = clientUsers[i % clientUsers.length];
            const prod = products[i % products.length];
            const r = await Render.create({
                user: user._id,
                title: renderTitles[i % renderTitles.length],
                originalPhoto: { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', publicId: 'room_orig_' + i },
                renderedPhoto: { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', publicId: 'room_rend_' + i },
                appliedProducts: [{ product: prod._id, productName: prod.name, sku: prod.sku, zone: 'floor' }],
                generationStatus: 'completed',
                generationPrompt: `neoclassical living room with ${prod.name} on the floor`,
                isShared: true,
                shareToken: 'share-token-' + i,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            renderList.push(r);
        }
        results.renders = renderList.length;

        // Seed Quotes
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];
        const quoteStatuses = ['new', 'contacted', 'quoted', 'converted', 'closed'];
        for (let i = 0; i < 15; i++) {
            const user = clientUsers[i % clientUsers.length];
            const prod = products[i % products.length];
            const area = 150 + (i * 50);
            const lineTotal = area * prod.pricePerSqFt;
            const q = await Quote.create({
                user: user._id,
                render: renderList[i % renderList.length]._id,
                contactName: user.name,
                contactPhone: '+91 98765 432' + i,
                contactEmail: user.email,
                city: cities[i % cities.length],
                lineItems: [{ product: prod._id, productName: prod.name, sku: prod.sku, zone: 'floor', estimatedArea: area, pricePerSqFt: prod.pricePerSqFt, lineTotal }],
                totalEstimate: lineTotal,
                status: quoteStatuses[i % quoteStatuses.length],
                clientMessage: `I need a quote for polishing ${area} sqft of ${prod.name} for my new residential project. Please contact me soon.`,
                projectType: 'residential',
                projectTimeline: '2 months',
                createdAt: new Date(Date.now() - (i * 4 * 24 * 60 * 60 * 1000))
            });
        }
        results.quotes = 15;

        // Seed Orders (Last 6 Months & Last 7 Days)
        const orderStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
        const paymentMethods = ['simulated_upi', 'simulated_card', 'razorpay'];
        let orderCount = 0;

        // A. Monthly distributed orders (past 6 months)
        for (let m = 5; m >= 0; m--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - m);
            monthDate.setDate(15); // middle of month

            // Create 5 orders per month
            for (let i = 0; i < 5; i++) {
                const user = clientUsers[i % clientUsers.length];
                const prod = products[(i + m) % products.length];
                const area = 200 + (i * 80);
                const lineTotal = area * prod.pricePerSqFt;
                const createdAt = new Date(monthDate);
                createdAt.setDate(5 + (i * 5)); // space out in the month

                await Order.create({
                    orderNumber: 'ORD-' + m + i + Math.floor(100 + Math.random() * 900),
                    user: user._id,
                    render: renderList[i % renderList.length]._id,
                    contactName: user.name,
                    contactPhone: '+91 99999 8888' + i,
                    contactEmail: user.email,
                    shippingAddress: { houseNumber: 'Flat ' + (100 + i), street: 'Luxury Road', city: cities[i % cities.length], state: 'State', pincode: '400001' },
                    lineItems: [{ product: prod._id, productName: prod.name, sku: prod.sku, zone: 'floor', estimatedArea: area, pricePerSqFt: prod.pricePerSqFt, lineTotal }],
                    totalAmount: lineTotal,
                    paymentMethod: paymentMethods[i % paymentMethods.length],
                    paymentStatus: i === 4 ? 'failed' : 'paid', // 1 failed, 4 paid
                    transactionId: 'TXN_SEED_' + m + i + Date.now(),
                    fulfillmentStatus: i === 3 ? 'cancelled' : orderStatuses[i % orderStatuses.length],
                    createdAt
                });
                orderCount++;
            }
        }

        // B. Daily distributed orders (past 7 days) to populate the weekly chart
        for (let d = 6; d >= 0; d--) {
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - d);
            dayDate.setHours(12, 0, 0, 0);

            // 1-2 orders per day
            const ordersOnDay = 1 + (d % 2);
            for (let i = 0; i < ordersOnDay; i++) {
                const user = clientUsers[i % clientUsers.length];
                const prod = products[(i + d) % products.length];
                const area = 150 + (i * 100);
                const lineTotal = area * prod.pricePerSqFt;

                await Order.create({
                    orderNumber: 'ORD-WK-' + d + i + Math.floor(100 + Math.random() * 900),
                    user: user._id,
                    render: renderList[i % renderList.length]._id,
                    contactName: user.name,
                    contactPhone: '+91 99999 7777' + i,
                    contactEmail: user.email,
                    shippingAddress: { houseNumber: 'Villa ' + (10 + i), street: 'Elite Lane', city: cities[i % cities.length], state: 'State', pincode: '500001' },
                    lineItems: [{ product: prod._id, productName: prod.name, sku: prod.sku, zone: 'floor', estimatedArea: area, pricePerSqFt: prod.pricePerSqFt, lineTotal }],
                    totalAmount: lineTotal,
                    paymentMethod: 'simulated_upi',
                    paymentStatus: 'paid',
                    transactionId: 'TXN_SEED_WK_' + d + i,
                    fulfillmentStatus: 'delivered',
                    createdAt: dayDate
                });
                orderCount++;
            }
        }
        results.orders = orderCount;

        // Seed notifications
        // 1. Admin notifications
        await NotificationModel.create([
            { isAdmin: true, title: "New Quote Request", message: "Jane Architect requested a quote of ₹1,35,000 for Italian Carrara White Marble", type: "new_quote", link: "/admin/quotes" },
            { isAdmin: true, title: "New Order Placed", message: "Bob Builder placed order #ORD-WK-10 for ₹88,000", type: "new_order", link: "/admin/orders" },
            { isAdmin: true, title: "New User Registered", message: "Alice Designer (alice@dsyn.com) registered an account.", type: "new_user", link: "/admin/users" }
        ]);

        // 2. Client notifications
        await NotificationModel.create([
            { user: sampleUser1._id, isAdmin: false, title: "Order Shipped", message: "Your order #ORD-WK-10 is now shipped and in transit.", type: "order_status", link: "/dashboard" },
            { user: sampleUser1._id, isAdmin: false, title: "AI Render Ready", message: "Your lobby visualization render is ready to view.", type: "render_completed", link: "/dashboard" },
            { user: sampleUser2._id, isAdmin: false, title: "Quote Updated", message: "Your quote request status has been updated to 'Quoted'.", type: "quote_status", link: "/dashboard" }
        ]);
        results.notifications = 6;

        res.json({ message: 'Sample data seeding completed successfully', results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.getCoupons = () => _coupons;
module.exports = router;

