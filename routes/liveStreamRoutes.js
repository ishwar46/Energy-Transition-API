const router = require("express").Router();
const { getLiveStreamUrl } = require("../controller/adminController");

// Public route to get the live stream URL
router.get("/livestream", getLiveStreamUrl);

module.exports = router;
