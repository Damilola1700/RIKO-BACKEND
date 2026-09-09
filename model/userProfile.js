const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [160, "Bio cannot exceed 160 characters"],
    },

    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);