const Notification = require("../models/notification");
const User = require("../models/user");
const admin = require('firebase-admin');

// Send notification to a specific user
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    // Create a new notification object, conditionally including userId
    const notificationData = { title, message };
    if (userId) {
      notificationData.userId = userId;
    }

    const newNotification = new Notification(notificationData);
    await newNotification.save();

    // Emit the notification to all connected clients via Socket.IO
    req.io.emit("receiveNotification", newNotification);

    // Send notification via Firebase (if userId is provided)
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.fcmToken) {
        const payload = {
          notification: {
            title,
            body: message,
          },
        };

        // Sending notification to the specific user's device via Firebase
        await admin.messaging().sendToDevice(user.fcmToken, payload);
        console.log(`Notification sent to user ${userId}`);
      }
    }

    res.status(200).json(newNotification);
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
};

// Send global notification to all users
exports.sendGlobalNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    // Create and save the notification in the database
    const newNotification = new Notification({ title, message });
    await newNotification.save();

    // Emit the notification to all connected clients via Socket.IO
    req.io.emit("receiveNotification", newNotification);

    // Fetch all users with FCM tokens
    const users = await User.find({}, 'fcmToken');
    const tokens = users.map(user => user.fcmToken).filter(token => token);

    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No FCM tokens found for users",
      });
    }

    // Send the notification via Firebase Cloud Messaging
    const payload = {
      notification: {
        title,
        body: message,
      },
    };
    const response = await admin.messaging().sendToDevice(tokens, payload);

    console.log(`Successfully sent notifications: ${response.successCount}`);
    console.log(`Failed to send notifications: ${response.failureCount}`);

    res.status(200).json({
      success: true,
      message: "Notification sent to all users",
      notification: newNotification,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("Error sending global notification:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all notifications for a specific user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({});
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ error: error.message });
  }
};
