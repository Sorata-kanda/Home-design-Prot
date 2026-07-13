const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// GET /api/notifications — Fetch notifications
router.get("/", protect, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === "admin") {
            query.$or = [
                { user: req.user._id },
                { isAdmin: true },
            ];
        } else {
            query.user = req.user._id;
            query.isAdmin = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/notifications/read-all — Mark all as read
router.patch("/read-all", protect, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === "admin") {
            query.$or = [
                { user: req.user._id },
                { isAdmin: true },
            ];
        } else {
            query.user = req.user._id;
            query.isAdmin = false;
        }

        await Notification.updateMany({ ...query, isRead: false }, { isRead: true });
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: "Notification not found" });
        res.json({ notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/notifications/clear — Clear notifications
router.delete("/clear", protect, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === "admin") {
            query.$or = [
                { user: req.user._id },
                { isAdmin: true },
            ];
        } else {
            query.user = req.user._id;
            query.isAdmin = false;
        }

        await Notification.deleteMany(query);
        res.json({ message: "All notifications cleared" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
