
const userProfile = require("../model/userProfile");
const cloudinary = require("../config/cloudinary");
const Follow = require("../model/follow");
const Article = require("../model/article");
const User = require("../model/user");
const Notification = require("../model/notification");

async function getProfile(req, res) {
  try {
    const profile = await userProfile.findOne({ user: req.user.id });
    const [followers, following, posts] = await Promise.all([
      Follow.countDocuments({ following: req.user.id }),
      Follow.countDocuments({ follower: req.user.id }),
      Article.find({ author: req.user.id, status: "published" })
        .populate("author", "email")
        .sort({ createdAt: -1 }),
    ]);

    posts.forEach((post) => {
      if (post.author) post.author = { ...post.author.toObject(), profile: profile?.toObject() || null };
    });

    return res.status(200).json({
      profile,
      user: { id: req.user.id, email: req.user.email },
      stats: { followers, following },
      posts,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function followUser(req, res) {
  try {
    if (req.params.userId === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    await Follow.create({ follower: req.user.id, following: req.params.userId });
    const actorName = req.user.email.split("@")[0];
    await Notification.create({
      recipientUser: req.params.userId,
      type: "follow",
      actor: req.user.id,
      message: `${actorName} started following you.`,
    });
    const followers = await Follow.countDocuments({ following: req.params.userId });
    return res.status(200).json({ message: "User followed successfully", followers, following: true });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "You already follow this user" });
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user" });
    }
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function unfollowUser(req, res) {
  try {
    await Follow.deleteOne({ follower: req.user.id, following: req.params.userId });
    const followers = await Follow.countDocuments({ following: req.params.userId });
    return res.status(200).json({ message: "User unfollowed successfully", followers, following: false });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function getRecommendedCreators(req, res) {
  try {
    const currentUserId = req.blogUser?._id;
    const userFilter = { verified: true };
    if (currentUserId) userFilter._id = { $ne: currentUserId };

    const creators = await User.find(userFilter).select("_id email").sort({ createdAt: -1 }).limit(6).lean();
    const creatorIds = creators.map((creator) => creator._id);
    const profiles = await userProfile.find({ user: { $in: creatorIds } }).lean();
    const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
    const followerCounts = await Follow.aggregate([
      { $match: { following: { $in: creatorIds } } },
      { $group: { _id: "$following", count: { $sum: 1 } } },
    ]);
    const countsByUser = new Map(followerCounts.map((item) => [String(item._id), item.count]));
    const followingIds = currentUserId
      ? await Follow.find({ follower: currentUserId, following: { $in: creatorIds } }).distinct("following")
      : [];
    const followingSet = new Set(followingIds.map(String));

    return res.status(200).json({ creators: creators.map((creator) => {
      const profile = profileByUser.get(String(creator._id));
      return {
        id: creator._id,
        name: profile?.name || creator.email.split("@")[0],
        username: profile?.username || "",
        profilePicture: profile?.profilePicture || "",
        followers: countsByUser.get(String(creator._id)) || 0,
        following: followingSet.has(String(creator._id)),
      };
    }) });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, username, bio } = req.body;

    const userId = req.user.id;

    if (!name && !username && !bio && !req.file) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    if (name && name.trim().length > 50) {
      return res.status(400).json({
        message: "Name cannot exceed 50 characters",
      });
    }

    
    if (username && username.trim().length > 30) {
      return res.status(400).json({
        message: "Username cannot exceed 30 characters",
      });
    }

   
    if (bio && bio.trim().length > 160) {
      return res.status(400).json({
        message: "Bio cannot exceed 160 characters",
      });
    }

    const updateData = {};

    // update where user wants to edit 
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (username !== undefined) {
      updateData.username = username.trim().toLowerCase();
    }

    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }

   
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");

      const dataUri = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "riko/userProfile",
      });

      updateData.profilePicture = result.secure_url;
    }

    const profile = await userProfile.findOneAndUpdate(
      { user: userId },
      updateData,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });

  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { getProfile, updateProfile, followUser, unfollowUser, getRecommendedCreators };
