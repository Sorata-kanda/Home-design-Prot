require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");

        // Get admin credentials from environment variables
        const adminEmail = process.env.ADMIN_EMAIL || "admin@arteffects.in";
        const adminPassword = process.env.ADMIN_PASSWORD || "ArtEffects@2024";

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            email: adminEmail,
        });
        if (existingAdmin) {
            console.log("Admin user already exists!");
            console.log("Email:", adminEmail);
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: "Admin User",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
        });

        console.log("✅ Admin user created successfully!");
        console.log("Email:", admin.email);
        console.log("Password:", adminPassword);
        console.log(
            "\nYou can now login at: https://arteffects.vercel.app/login",
        );

        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
        process.exit(1);
    }
}

createAdmin();
