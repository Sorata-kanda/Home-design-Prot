require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

// Heavier limit for AI generation endpoint
const generateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Generation limit reached, please wait a minute.",
});
app.use("/api/visualizer/generate", generateLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/visualizer", require("./routes/visualizer"));
app.use("/api/renders", require("./routes/renders"));
app.use("/api/quotes", require("./routes/quotes"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/health", (req, res) =>
    res.json({ status: "ok", timestamp: new Date() }),
);

// MongoDB connection
const User = require("./models/User");
mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/arteffects")
    .then(async () => {
        console.log("MongoDB connected");
        
        // Auto-create admin user on boot
        try {
            const adminEmail = process.env.ADMIN_EMAIL || "admin@arteffects.in";
            const adminPassword = process.env.ADMIN_PASSWORD || "ArtEffects@2024";
            
            const existingAdmin = await User.findOne({ email: adminEmail });
            if (!existingAdmin) {
                await User.create({
                    name: "Admin User",
                    email: adminEmail,
                    password: adminPassword,
                    role: "admin",
                    isVerified: true // Pre-verify the admin account
                });
                console.log("✅ Auto-created admin user on boot:", adminEmail);
            }
        } catch (adminErr) {
            console.error("❌ Failed to auto-create admin on boot:", adminErr.message);
        }
    })
    .catch((err) => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Arteffects server running on port ${PORT}`),
);

module.exports = app;
// reload nodemon
