const express = require("express");
const authenticate = require("../middleware/authUser");
const adminAuthenticate = require("../middleware/authadmin");
const {
  getUserNotifications,
  getAdminNotifications,
  markUserNotificationsRead,
  markAdminNotificationsRead,
} = require("../controller/notificationController");

const router = express.Router();
router.get("/", authenticate, getUserNotifications);
router.patch("/read", authenticate, markUserNotificationsRead);
router.get("/admin", adminAuthenticate, getAdminNotifications);
router.patch("/admin/read", adminAuthenticate, markAdminNotificationsRead);

module.exports = router;