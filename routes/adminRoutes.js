const router = require("express").Router();
const {
  adminRegister,
  adminLogin,
  adminVerifyUser,
  deleteUser,
  adminEditUser,
  adminResetPassword,
  updateConferenceKitStatus,
  postLiveStreamUrl,
  getLiveStreamUrl,
  adminCheckInUser,
  adminGetCheckInList,
  createVolunteer,
  getAllVolunteer,
  deleteVolunteerById,
  updateVolunteerById
} = require("../controller/adminController");

router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.put("/verify/:userId", adminVerifyUser);
router.delete("/delete/:userId", deleteUser);
router.put("/edit/:userId", adminEditUser);
router.put("/reset-password/:userId", adminResetPassword);
router.put("/conference-kit/:userId", updateConferenceKitStatus);
// Admin posts the live stream URL
router.post("/livestream", postLiveStreamUrl);
router.get("/checkin-list", adminGetCheckInList);
router.put("/checkin/:userId", adminCheckInUser);

//Admin creating volunteer 
router.post("/register/volunteer", createVolunteer)
router.get("/getall/volunteer", getAllVolunteer)
router.delete("/delete/volunteer/:id", deleteVolunteerById)
router.put("/update/volunteer/:id", updateVolunteerById)



module.exports = router;