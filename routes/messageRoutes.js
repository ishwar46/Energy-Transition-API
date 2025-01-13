const router = require("express").Router();
const messageController = require("../controller/messagesController");

router.post("/create", messageController.createMessage);
router.get("/getall", messageController.getAllMessage);
router.delete("/delete/:id", messageController.deleteMessage);

module.exports = router;
