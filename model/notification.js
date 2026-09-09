const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    type: { type: String, enum: ["follow", "comment", "signup", "post"], required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUser: 1, createdAt: -1 });
notificationSchema.index({ recipientAdmin: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);