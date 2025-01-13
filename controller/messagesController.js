const upload = require("../middleware/multipledocs");
const Messages = require("../models/messages");
const fs = require("fs");

const createMessage = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "Error uploading file.",
          error: err.message,
        });
      }
      console.log("Files:", req.files);
      console.log("Body:", req.body);

      if (!req.files) {
        return res.status(400).send({
          success: false,
          message: "file path missing.",
        });
      }

      const author1Signature = req.files.author1signature
        ? req.files.author1signature[0].path.replace(/\\/g, "/")
        : "";
      const author1Image = req.files.author1image
        ? req.files.author1image[0].path.replace(/\\/g, "/")
        : "";
      const author2Signature = req.files.author2signature
        ? req.files.author2signature[0].path.replace(/\\/g, "/")
        : "";
      const author2Image = req.files.author2image
        ? req.files.author2image[0].path.replace(/\\/g, "/")
        : "";

      const {
        msgFrom,
        msgTitle,
        msgGreeting,
        msgDescription,
        msgEndingRemarks,
        author1fullName,
        author1description,
        author2fullName,
        author2description,
      } = req.body;

      const messageData = new Messages({
        msgFrom,
        msgTitle,
        msgGreeting,
        msgDescription,
        msgEndingRemarks,
        author1: {
          author1fullName: author1fullName || "",
          author1description: author1description || "",
          author1signature: author1Signature || "",
          author1image: author1Image || "",
        },
        author2: {
          author2fullName: author2fullName || "",
          author2description: author2description || "",
          author2signature: author2Signature || "",
          author2image: author2Image || "",
        },
      });
      const savedMessage = await messageData.save();
      return res.status(201).json({
        success: true,
        message: "Message created successfully.",
        data: savedMessage,
      });
    });
  } catch (error) {
    console.error(`Error while creating message: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

const getAllMessage = async (req, res) => {
  try {
    const allMessage = await Messages.find();
    if (!allMessage) {
      return res.status(400).send("Messages not Found");
    }
    return res.status(200).json({
      success: true,
      allMessage,
      message: "All Messages Fetched Successfully",
    });
  } catch (error) {
    console.error(`Error while getting message: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

const path = require("path");

const deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Messages.findByIdAndDelete(req.params.id);

    if (!deletedMessage) {
      return res.status(404).send("Message not found");
    }

    const filesToDelete = [
      deletedMessage.author1.author1image,
      deletedMessage.author1.author1signature,
      deletedMessage.author2.author2image,
      deletedMessage.author2.author2signature,
    ];

    filesToDelete.forEach((file) => {
      if (file) {
        const filePath = path.resolve(file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    return res.status(200).json({
      success: true,
      deletedMessage,
      message: "Message Deleted Successfully",
    });
  } catch (error) {
    console.error(`Error while deleting message: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createMessage,
  getAllMessage,
  deleteMessage,
};
