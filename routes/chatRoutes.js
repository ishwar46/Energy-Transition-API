const express = require("express");
const router = express.Router();
const { getAllMessages, saveMessage } = require("../controller/chatController");

router.get("/", getAllMessages);
router.post("/", saveMessage);

module.exports = router;
