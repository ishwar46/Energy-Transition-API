const Session = require("../models/season");
const Speaker = require("../models/speaker");
const User = require("../models/user");
const admin = require('firebase-admin');

const sendNotificationToAllUsers = async (message) => {
  try {
    const users = await User.find({}, 'fcmToken');
    const tokens = users.map(user => user.fcmToken).filter(token => token);

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: message.title,
          body: message.body,
        },
      };

      let successCount = 0;
      let failureCount = 0;

      // Loop through tokens and send notifications with a delay
      for (const [index, token] of tokens.entries()) {
        try {
          const response = await admin.messaging().send({
            token: token,
            ...payload,
          });
          console.log(`Notification sent to ${token}:`, response);
          successCount += 1;
        } catch (error) {
          console.error(`Failed to send notification to ${token}:`, error);
          failureCount += 1;
        }

        // Add a 2-second delay between sending notifications
        if (index < tokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('Successfully sent messages:', successCount);
      console.log('Failed messages:', failureCount);

      return {
        successCount,
        failureCount,
      };
    } else {
      console.log('No valid FCM tokens found');
      return { successCount: 0, failureCount: 0 };
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new Error('Notification sending failed');
  }
};

// Controller functions
const createSession = async (req, res) => {
  try {
    const { title, description, speakers, remarks, startTime, endTime } =
      req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).send({
        success: false,
        message: "All fields are required.",
      });
    }

    const newSession = new Session({
      title,
      description,
      speakers,
      remarks,
      startTime,
      endTime,
    });

    await newSession.save();
    await sendNotificationToAllUsers({
      title: 'New Session Created',
      body: `A new session titled "${title}" has been created.`,
    });

    return res.status(200).send({
      success: true,
      message: "Session created successfully",
      session: newSession,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

const startSession = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if there's already a running session that is not completed
    const runningSession = await Session.findOne({ status: "in_progress" });

    if (runningSession) {
      return res.status(400).send({
        success: false,
        message:
          "There is already a running session. Please complete or end it before starting a new one.",
      });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
    session.status = "in_progress";
    session.actualStartTime = new Date();
    await session.save();
    await sendNotificationToAllUsers({
      title: 'Session Started',
      body: `The session titled "${session.title}" has started.`,
    });
    return res.status(200).send({
      success: true,
      message: "Session started successfully",
      session,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

const endSession = async (req, res) => {
  // console.log("End session called with ID:", req.params.id);
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
    session.status = "completed";
    session.actualEndTime = new Date();
    await session.save();
    await sendNotificationToAllUsers({
      title: 'Session Ended',
      body: `The session titled "${session.title}" has ended.`,
    });
    return res.status(200).send({
      success: true,
      message: "Session ended successfully",
      session,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

const cancelSession = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({
        success: false,
        message: "Session not found",
      });
    }
    session.status = "cancelled";
    await session.save();
    await sendNotificationToAllUsers({
      title: 'Session Cancelled',
      body: `The session titled "${session.title}" has been cancelled.`,
    });
    return res.status(200).send({
      success: true,
      message: "Session cancelled successfully",
      session,
    });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

// Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().populate("speakers");
    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch sessions. Please try again." });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId)
      .populate("speakers")
      .populate("attendance.user");

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    res.json(session);
  } catch (err) {
    console.error("Error fetching session by ID:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch session. Please try again." });
  }
};

// Add attendance for a session
const markUserAttendance = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const session = await Session.findById(sessionId);
    const user = await User.findById(userId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const alreadyMarked = session.attendance.some(
      (attendee) => attendee.user && attendee.user.equals(userId)
    );

    if (alreadyMarked) {
      return res
        .status(400)
        .json({ error: "User already marked for attendance." });
    }

    session.attendance.push({ user: userId, joinTime: new Date() });
    await session.save();

    user.sessionsAttended.push(sessionId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "User attendance marked successfully.",
      session,
    });
  } catch (error) {
    console.error("Error in marking user attendance:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const markSpeakerAttendance = async (req, res) => {
  try {
    const { sessionId, speakerId } = req.body;
    const session = await Session.findById(sessionId);
    const speaker = await Speaker.findById(speakerId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (!speaker) {
      return res.status(404).json({ error: "Speaker not found." });
    }

    const alreadyMarked = session.attendance.some(
      (attendee) => attendee.speaker && attendee.speaker.equals(speakerId)
    );

    if (alreadyMarked) {
      return res
        .status(400)
        .json({ error: "Speaker already marked for attendance." });
    }

    session.attendance.push({ speaker: speakerId, joinTime: new Date() });
    await session.save();

    res.status(200).json({
      success: true,
      message: "Speaker attendance marked successfully.",
      session,
    });
  } catch (error) {
    console.error("Error in marking speaker attendance:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId)
      .populate("attendance.user", "personalInformation.fullName")
      .populate("attendance.speaker", "fullName");

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const attendanceRecords = session.attendance.map((record) => {
      if (record.user) {
        return {
          name: `${record.user.personalInformation.fullName.firstName} ${record.user.personalInformation.fullName.middleName} ${record.user.personalInformation.fullName.lastName}`.trim(),
          role: "user",
          joinTime: record.joinTime,
        };
      } else if (record.speaker) {
        return {
          name: record.speaker.fullName,
          role: "speaker",
          joinTime: record.joinTime,
        };
      }
    });

    res.status(200).json({
      success: true,
      attendance: attendanceRecords,
    });
  } catch (error) {
    console.error("Error in getting attendance:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
const addComment = async (req, res) => {
  try {
    const { sessionId, userId, speakerId, comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: "Comment is required." });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      session.comments.push({ user: userId, comment });
    } else if (speakerId) {
      const speaker = await Speaker.findById(speakerId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found." });
      }
      session.comments.push({ speaker: speakerId, comment });
    } else {
      return res.status(400).json({ error: "Either userId or speakerId is required." });
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Comment added successfully.",
      session,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllComments = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId)
      .populate("comments.user", "personalInformation.fullName")
      .populate("comments.speaker", "fullName");

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const comments = session.comments.map((comment) => {
      return {
        user: comment.user
          ? `${comment.user.personalInformation.fullName.firstName} ${comment.user.personalInformation.fullName.middleName || ''} ${comment.user.personalInformation.fullName.lastName || ''}`.trim()
          : null,
        speaker: comment.speaker ? comment.speaker.fullName : null,
        comment: comment.comment,
        timestamp: comment.timestamp,
      };
    });

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//Edit or Update Sessions
const editSession = async (req, res) => {
  try {
    const { id } = req.params; // Session ID from URL parameters
    const updateData = req.body; // Fields to update from request body

    // Define fields that are allowed to be updated
    const allowedUpdates = ['title', 'description', 'speakers', 'startTime', 'endTime', 'remarks'];

    // Extract the fields to be updated
    const updates = Object.keys(updateData);
    const isValidOperation = updates.every((field) => allowedUpdates.includes(field));

    if (!isValidOperation) {
      return res.status(400).send({
        success: false,
        message: "Invalid updates! Only title, description, speakers, startTime, endTime, and remarks can be updated.",
      });
    }

    // Find the session by ID
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({
        success: false,
        message: "Session not found.",
      });
    }

    // Allow editing only if session is in 'scheduled' status
    if (session.status !== "scheduled") {
      return res.status(400).send({
        success: false,
        message: `Cannot edit session as it is currently "${session.status}". Only sessions with status "scheduled" can be edited.`,
      });
    }

    // If updating speakers, validate that speaker IDs exist
    if (updateData.speakers && Array.isArray(updateData.speakers)) {
      for (let speakerId of updateData.speakers) {
        const speakerExists = await Speaker.findById(speakerId);
        if (!speakerExists) {
          return res.status(400).send({
            success: false,
            message: `Speaker with ID ${speakerId} does not exist.`,
          });
        }
      }
    }

    // If updating startTime and endTime, validate that startTime is before endTime
    if (updateData.startTime && updateData.endTime) {
      if (new Date(updateData.startTime) >= new Date(updateData.endTime)) {
        return res.status(400).send({
          success: false,
          message: "startTime must be before endTime.",
        });
      }
    }

    // Apply the updates to the session
    updates.forEach((field) => {
      session[field] = updateData[field];
    });

    await session.save();

    // Optionally, send a notification about the session being updated
    await sendNotificationToAllUsers({
      title: 'Session Updated',
      body: `The session titled "${session.title}" has been updated.`,
    });

    return res.status(200).send({
      success: true,
      message: "Session updated successfully.",
      session,
    });

  } catch (error) {
    console.error("Error editing session:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};
module.exports = {
  createSession,
  startSession,
  endSession,
  cancelSession,
  getAllSessions,
  getSessionById,
  markUserAttendance,
  markSpeakerAttendance,
  getAllAttendance,
  addComment,
  getAllComments,
  editSession
};
