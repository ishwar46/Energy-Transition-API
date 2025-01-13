const Chat = require("../models/chat");

// Fetch all chat messages
const getAllMessages = async (req, res) => {
    try {
        const messages = await Chat.find().populate('userId', 'personalInformation.fullName profilePicture');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
};

// Save a new chat message
const saveMessage = async (req, res) => {
    try {
        const { userId, message } = req.body;
        const newMessage = new Chat({ userId, message });
        await newMessage.save();

        const populatedMessage = await newMessage.populate('userId', 'personalInformation.fullName profilePicture.fileName').execPopulate();
        req.io.emit("receiveMessage", populatedMessage);

        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    getAllMessages,
    saveMessage,
};
