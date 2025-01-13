// routes/userRoutes.js
const router = require("express").Router();
const userController = require("../controller/userController");
const authMiddleware = require("../middleware/routesAuth");
const userMiddleware = require("../middleware/userMiddleware");
const User = require("../models/user");
const mongoose = require("mongoose");

// Public routes
router.post("/userregister", userController.userRegister);
router.post("/userlogin", userController.login);
router.get("/gtusers", userController.getUserByInstiuition);
router.post("/changepassword", userController.changePassword);
router.post("/markAttendance", userController.markAttendance);
router.get("/generateQR/:userId", userController.generateQRCode);
router.post("/markExcursion", userController.markExcursion);
router.put("/:userid/location", userController.postLocation);
router.get("/location/:userid", userController.getOnlyLocationWithUserId);
// Route to get all participants with their meal and excursion statuses
router.get("/meals-and-excursions", userController.getMealsAndExcursions);

router.post("/markMeal", userController.markMeal);
router.post("/markExcursion", userController.markExcursion);

// Route to update meal status for a specific participant
router.put("/meals/:userId/:mealType", userController.updateMealStatus);

// Route to update excursion status for a specific participant
router.put("/excursions/:userId", userController.updateExcursionStatus);

// Routes accessible by any authenticated user
router.get("/getUserByid", userMiddleware, userController.getUserById);
router.get("/getUserByid/:id", userController.getUsersById);
router.put("/profile/:id", userController.updateUserProfile);

// Routes accessible by admin only
router.get("/getAllUser", authMiddleware, userController.getAllUsers);
router.get("/allUser", userMiddleware, userController.getAllUsers);
router.put("/:userId", userController.updateUserById);
router.get("/alllocation", userController.getAllUserLocation);
// POST /register-token
router.post("/register-token", async (req, res) => {
    const { userId, fcmToken } = req.body;
    try {
        const validUserId = new mongoose.Types.ObjectId(userId);
        const user = await User.findById(validUserId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.fcmToken = fcmToken;
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "FCM token registered successfully" });
    } catch (error) {
        console.error("Error registering FCM token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
module.exports = router;