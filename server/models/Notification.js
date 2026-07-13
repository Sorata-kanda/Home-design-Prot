const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Null means all admins or public
        isAdmin: { type: Boolean, default: false }, // If true, only visible to admins
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, default: "general" },
        link: { type: String, default: "" },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, isAdmin: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
