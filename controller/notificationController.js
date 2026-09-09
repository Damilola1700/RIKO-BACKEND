const Notification = require("../model/notification");
const UserProfile = require("../model/userProfile");

async function attachActorProfiles(notifications) {
  const actorIds = notifications.map((notification) => notification.actor?._id).filter(Boolean);
  const profiles = await UserProfile.find({ user: { $in: actorIds } }).select("user name username profilePicture").lean();
  const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
  notifications.forEach((notification) => {
    if (notification.actor) notification.actor.profile = profileByUser.get(String(notification.actor._id)) || null;
  });
  return notifications;
}

async function getUserNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipientUser: req.blogUser._id })
      .populate("actor", "email")
      .populate("article", "title")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    await attachActorProfiles(notifications);
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load notifications", error: error.message });
  }
}

async function getAdminNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipientAdmin: req.admin._id })
      .populate("actor", "email")
      .populate("article", "title")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    await attachActorProfiles(notifications);
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load notifications", error: error.message });
  }
}

async function markUserNotificationsRead(req, res) {
  await Notification.updateMany({ recipientUser: req.blogUser._id, read: false }, { read: true });
  return res.status(200).json({ message: "Notifications marked as read" });
}

async function markAdminNotificationsRead(req, res) {
  await Notification.updateMany({ recipientAdmin: req.admin._id, read: false }, { read: true });
  return res.status(200).json({ message: "Notifications marked as read" });
}

module.exports = {
  getUserNotifications,
  getAdminNotifications,
  markUserNotificationsRead,
  markAdminNotificationsRead,
};