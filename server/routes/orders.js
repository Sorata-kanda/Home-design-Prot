const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");
const { protect, adminOnly, optionalAuth } = require("../middleware/auth");
const mongoose = require("mongoose");

const generateOrderNumber = () =>
    "ORD-" + crypto.randomBytes(3).toString("hex").toUpperCase();

// Public coupon validation route (no auth required)
router.get("/coupon/validate", (req, res) => {
    try {
        const { getCoupons } = require("./admin");
        const _coupons = getCoupons();
        const code = (req.query.code || "").toUpperCase().trim();
        const coupon = _coupons.find((c) => c.code === code && c.active);
        if (!coupon) return res.status(404).json({ error: "Invalid or inactive coupon code" });
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ error: "This coupon has expired" });
        }
        res.json({ coupon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 1. SIMULATED CHECKOUT (For Portfolio/Demo)
// ==========================================
router.post("/simulated-checkout", optionalAuth, async (req, res) => {
    try {
        const {
            contactName,
            contactPhone,
            contactEmail,
            shippingAddress,
            lineItems,
            totalAmount,
            paymentMethod,
            renderId,
        } = req.body;

        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            user: req.user ? req.user._id : null, // Assuming optional auth, though frontend might send it
            render: renderId,
            contactName,
            contactPhone,
            contactEmail,
            shippingAddress,
            lineItems,
            totalAmount,
            paymentMethod,
            paymentStatus: "paid", // Instantly paid in simulation
            transactionId: `SIM_TXN_${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            fulfillmentStatus: "processing",
        });

        // Notify user and admins
        try {
            const { createNotification } = require("../utils/notifications");
            // Admin notification
            await createNotification({
                isAdmin: true,
                title: "New Order Placed",
                message: `Order #${order.orderNumber} placed by ${contactName} for ₹${totalAmount.toLocaleString('en-IN')}`,
                type: "new_order",
                link: "/admin/orders"
            });
            // Client notification
            if (req.user) {
                await createNotification({
                    user: req.user._id,
                    title: "Order Placed Successfully",
                    message: `Your order #${order.orderNumber} has been received and is being processed.`,
                    type: "order_status",
                    link: "/dashboard"
                });
            }
        } catch (e) {
            console.error("Order notification error:", e);
        }

        res.json({ message: "Payment successful", order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. RAZORPAY SKELETON (For Future Client)
// ==========================================
const Razorpay = require("razorpay");

// Initialize Razorpay only if credentials are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay payment gateway initialized");
} else {
    console.warn(
        "⚠️ Razorpay credentials not found - payment features disabled",
    );
}

// Step 2A: Create Razorpay Order
router.post("/razorpay/create", optionalAuth, async (req, res) => {
    if (!razorpay) {
        return res
            .status(503)
            .json({
                error: "Payment gateway not configured. Please contact support.",
            });
    }
    try {
        const {
            totalAmount,
            contactName,
            contactPhone,
            contactEmail,
            shippingAddress,
            lineItems,
            renderId,
        } = req.body;
        const options = {
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: "INR",
            receipt: `RCPT_${crypto.randomBytes(4).toString("hex")}`,
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Create pending order in DB
        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            user: req.user ? req.user._id : null,
            render: renderId,
            contactName,
            contactPhone,
            contactEmail,
            shippingAddress,
            lineItems,
            totalAmount,
            paymentMethod: "razorpay",
            paymentStatus: "pending",
            transactionId: rzpOrder.id,
            fulfillmentStatus: "processing",
        });

        res.json({ rzpOrder, orderId: order._id });
    } catch (err) {
        console.error("Razorpay Error:", err);
        const errorMsg =
            err.error?.description || err.message || JSON.stringify(err);
        res.status(500).json({ error: errorMsg });
    }
});

// Step 2B: Verify Signature Webhook
router.post("/razorpay/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const order = await Order.findByIdAndUpdate(orderId, {
                paymentStatus: "paid",
                transactionId: razorpay_payment_id,
            }, { new: true });

            if (order) {
                try {
                    const { createNotification } = require("../utils/notifications");
                    // Admin notification
                    await createNotification({
                        isAdmin: true,
                        title: "New Order Paid",
                        message: `Order #${order.orderNumber} placed by ${order.contactName} for ₹${order.totalAmount.toLocaleString('en-IN')}`,
                        type: "new_order",
                        link: "/admin/orders"
                    });
                    // Client notification
                    if (order.user) {
                        await createNotification({
                            user: order.user,
                            title: "Payment Received",
                            message: `Payment received for order #${order.orderNumber}. We are processing it.`,
                            type: "order_status",
                            link: "/dashboard"
                        });
                    }
                } catch (e) {
                    console.error("Razorpay verification notification error:", e);
                }
            }

            return res.json({ message: "Payment verified successfully" });
        } else {
            await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
            return res.status(400).json({ error: "Invalid signature" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. ADMIN ROUTES (For Orders Tab)
// ==========================================

// Get user's own orders
router.get("/mine", protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("lineItems.product", "textureImage thumbnailImage sku")
            .lean();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders (Admin only)
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .populate("lineItems.product", "textureImage thumbnailImage sku")
            .lean();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update fulfillment status
router.patch("/:id/fulfillment", protect, adminOnly, async (req, res) => {
    try {
        const { fulfillmentStatus } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { fulfillmentStatus },
            { new: true },
        );
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Notify client about order status update
        if (order.user) {
            try {
                const { createNotification } = require("../utils/notifications");
                await createNotification({
                    user: order.user,
                    title: "Order Status Updated",
                    message: `Your order #${order.orderNumber} is now "${fulfillmentStatus}".`,
                    type: "order_status",
                    link: "/dashboard"
                });
            } catch (e) {
                console.error("Order fulfillment update notification error:", e);
            }
        }

        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
