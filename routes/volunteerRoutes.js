const router = require("express").Router();
const volunteerController = require("../controller/volunteerController")


router.post("/login", volunteerController.volunteerLogin)
router.get("/profile/:id", volunteerController.volunteerProfile)

module.exports = router;