const Notification = require("../models/Notification");

async function createNotification({ user, isAdmin, title, message, type, link }) {
    try {
        const notif = await Notification.create({
            user: user || null,
            isAdmin: !!isAdmin,
            title,
            message,
            type,
            link,
        });
        return notif;
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
}

module.exports = { createNotification };
