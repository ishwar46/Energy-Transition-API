const Subscription = require("../models/subscription");

// Controller function to add a new subscription
const addSubscription = async (req, res) => {
    try {
        const { fullname, email, message } = req.body;

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Validate required fields
        if (!fullname || !message) {
            return res.status(400).json({ error: "Fullname and message are required" });
        }

        const newSubscription = new Subscription({ fullname, email, message });
        await newSubscription.save();

        return res.status(200).json({
            success: true,
            message: "Queries sent successfully",
        });
    } catch (error) {
        console.error("Error sending queries:", error);
        res.status(500).json({ error: "Failed to add queries" });
    }
};

// Controller function to get all subscriptions
const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find();
        res.status(200).json({ subscriptions });
    } catch (error) {
        console.error("Error getting subscriptions:", error);
        res.status(500).json({ error: "Failed to get subscriptions" });
    }
};

module.exports = { addSubscription, getAllSubscriptions };
