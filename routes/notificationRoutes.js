const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

// Route to send a notification to a specific user
router.post("/send", notificationController.sendNotification);

// Route to send a global notification to all users
router.post("/sendGlobal", notificationController.sendGlobalNotification);

// Route to get all notifications for a specific user
router.get("/user/:userId", notificationController.getNotifications);

// Route to get all notifications
router.get("/all", notificationController.getAllNotifications);

module.exports = router;
