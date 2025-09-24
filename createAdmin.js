const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user");
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB using the URL from your .env
        await mongoose.connect('mongodb+srv://uranusenergy:CWDrZ9x5FQOLfQHt@greenenergy.ig3dils.mongodb.net/greenenergy');

        console.log("Connected to MongoDB");

        // Admin credentials
        const adminEmail = "admin@energytransition.com";
        const adminPassword = "Admin123!";

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail, isAdmin: true });

        if (existingAdmin) {
            console.log("Admin user already exists with email:", adminEmail);
            process.exit(0);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        const admin = new User({
            email: adminEmail,
            password: hashedPassword,
            isAdmin: true,
            isVerifiedByAdmin: true,
            personalInformation: {
                fullName: {
                    firstName: "Admin",
                    lastName: "User"
                },
                emailAddress: adminEmail,
                participantType: "VIP Guest"
            },
            adminVerification: {
                status: "accepted",
                verifiedDate: new Date()
            }
        });

        await admin.save();

        console.log("✅ Admin user created successfully!");
        console.log("Email:", adminEmail);
        console.log("Password:", adminPassword);
        console.log("Please change the password after first login.");

    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

createAdminUser();