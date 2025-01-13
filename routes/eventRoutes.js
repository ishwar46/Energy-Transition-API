const express = require("express");
const router = express.Router();
const eventController = require("../controller/eventController");

// Get all events
router.get("/", eventController.getAllEvents);

// Get a single event by ID
router.get("/:id", eventController.getEventById);

// Create a new event
router.post("/", eventController.createEvent);

// Update an event
router.put("/:id", eventController.updateEvent);

// Delete an event
router.delete("/:id", eventController.deleteEvent);

module.exports = router;
