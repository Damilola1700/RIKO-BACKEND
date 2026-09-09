const express = require("express");
const router = express.Router();

const {
	RegisterAdmin,
	Login,
	verifyOTP,
	getAdmin,
	getDashboard,
	getAdminPosts,
	updateAdminPost,
	deleteAdminPost,
	getAdminUsers,
	getAdminUserProfile,
	updateAdminUser,
	deleteAdminUser,
	resendOTP,
} = require("../controller/adminController");

const authenticate = require("../middleware/authadmin");
const { getAdminNotifications, markAdminNotificationsRead } = require("../controller/notificationController");


router.get("/", authenticate, getAdmin);
router.get("/dashboard", authenticate, getDashboard);
router.get("/notifications", authenticate, getAdminNotifications);
router.patch("/notifications/read", authenticate, markAdminNotificationsRead);
router.get("/posts", authenticate, getAdminPosts);
router.patch("/posts/:id", authenticate, updateAdminPost);
router.delete("/posts/:id", authenticate, deleteAdminPost);
router.get("/users", authenticate, getAdminUsers);
router.get("/users/:id/profile", authenticate, getAdminUserProfile);
router.patch("/users/:id", authenticate, updateAdminUser);
router.delete("/users/:id", authenticate, deleteAdminUser);
router.post("/register", RegisterAdmin);
router.post("/login", Login);
router.post("/verifyotp", verifyOTP);
router.post("/resendotp", resendOTP);

module.exports = router;