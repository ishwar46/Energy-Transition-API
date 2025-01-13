const seasonController = require("../controller/seasonController");
const authMiddleware = require("../middleware/routesAuth");
const express = require("express");
const router = express.Router();

router.post("/createsessions", authMiddleware, seasonController.createSession);

// Get all sessions
router.get("/getAllsessions", seasonController.getAllSessions);

// Get session by ID
router.get("/getSessionsById/:id", seasonController.getSessionById);

// Start, end, edit and cancel sessions
router.put("/startSession/:id", authMiddleware, seasonController.startSession);
router.put("/endSession/:id", authMiddleware, seasonController.endSession);
router.put(
  "/cancelSession/:id",
  authMiddleware,
  seasonController.cancelSession
);
router.put("/editSession/:id", authMiddleware, seasonController.editSession);

// Add attendance for a session
router.post(
  "/markUserAttendance",
  seasonController.markUserAttendance
);
router.post(
  "/markSpeakerAttendance",

  seasonController.markSpeakerAttendance
);
router.get("/getAllAttendance/:sessionId", authMiddleware, seasonController.getAllAttendance);
router.post("/addComment", seasonController.addComment);
router.get("/getAllComments/:sessionId", seasonController.getAllComments);

module.exports = router;
