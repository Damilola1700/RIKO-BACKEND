const admin = require("../model/admin");
const Article = require("../model/article");
const User = require("../model/user");
const UserProfile = require("../model/userProfile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");;
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function attachProfiles(records, userKey = "") {
  const userIds = records
    .map((record) => userKey ? record[userKey]?._id : record._id)
    .filter(Boolean);
  const profiles = await UserProfile.find({ user: { $in: userIds } })
    .select("user name username profilePicture")
    .lean();
  const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));

  records.forEach((record) => {
    const user = userKey ? record[userKey] : record;
    if (!user) return;
    if (userKey) {
      record[userKey] = { ...user, profile: profileByUser.get(String(user._id)) || null };
    } else {
      record.profile = profileByUser.get(String(user._id)) || null;
    }
  });

  return records;
}

async function RegisterAdmin(req, res){
    try {
        const{email, password} = req.body;

        if(!email || !password){
            return res.status(403).send("Fill in required fields");
        }

        const existingAdmin = await admin.findOne({email});

        if(existingAdmin){
            return res.status(400).json({
                message: "Email already exists, kindly register with a new email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdminUser = new admin({
            email:email,
            password:hashedPassword,
            verified: true,
        });
        await newAdminUser.save();

        res.status(201).json({
            message: "Admin registration successful. Please sign in.",
            user:{
                id:newAdminUser._id,
                email:newAdminUser.email,
            },
        });

    } catch (error) {
       res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
       }); 
    }
}

async function Login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).send("fields required");
    }
    const isAdmin = await admin.findOne({ email: email });

    if (!isAdmin) {
      return res.status(404).send("Incorrect Email");
    }

    const comparePassword = await bcrypt.compare(password, isAdmin.password);

    if (!comparePassword) {
      return res.status(403).send("Incorrect Password");
    }

    const token = jwt.sign({ id: isAdmin.id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error",error: error.message, });
  }
}

async function getAdmin(req, res) {
  try {
    const allAdmin = await admin.find();
    res.status(200).json({ message: "all user fetched successfully", allAdmin });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

async function getDashboard(req, res) {
  try {
    const [totalUsers, totalPosts, publishedPosts, viewTotals, recentPostsData, recentUsersData] = await Promise.all([
      User.countDocuments(),
      Article.countDocuments(),
      Article.countDocuments({ status: "published" }),
      Article.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),
      Article.find({ status: "published" })
        .populate("author", "email")
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      User.find().select("email createdAt").sort({ createdAt: -1 }).limit(4).lean(),
    ]);

    const [recentPosts, recentUsers] = await Promise.all([
      attachProfiles(recentPostsData, "author"),
      attachProfiles(recentUsersData),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalPosts,
        publishedPosts,
        totalViews: viewTotals[0]?.total || 0,
      },
      recentPosts,
      recentUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load dashboard", error: error.message });
  }
}

async function getAdminPosts(req, res) {
  try {
    const posts = await Article.find()
      .populate("author", "email")
      .sort({ createdAt: -1 })
      .lean();
    await attachProfiles(posts, "author");

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load posts", error: error.message });
  }
}

async function updateAdminPost(req, res) {
  try {
    const allowedFields = ["title", "content", "category", "status"];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field]])
    );

    if (updates.status && !["draft", "published", "pending"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid post status" });
    }

    const post = await Article.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("author", "email");

    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    return res.status(400).json({ message: "Unable to update post", error: error.message });
  }
}

async function deleteAdminPost(req, res) {
  try {
    const post = await Article.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Unable to delete post", error: error.message });
  }
}

async function getAdminUsers(req, res) {
  try {
    const users = await User.find().select("-password -otp -otpTiming").sort({ createdAt: -1 }).lean();
    await attachProfiles(users);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load users", error: error.message });
  }
}

async function getAdminUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -otpTiming").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [profile, posts] = await Promise.all([
      UserProfile.findOne({ user: user._id }).lean(),
      Article.find({ author: user._id, status: "published" })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({ user, profile, posts });
  } catch (error) {
    return res.status(400).json({ message: "Unable to load user profile", error: error.message });
  }
}

async function updateAdminUser(req, res) {
  try {
    const updates = {};
    if (req.body.verified !== undefined) updates.verified = Boolean(req.body.verified);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select("-password -otp -otpTiming");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(400).json({ message: "Unable to update user", error: error.message });
  }
}

async function deleteAdminUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Article.deleteMany({ author: user._id });
    return res.status(200).json({ message: "User and authored posts deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Unable to delete user", error: error.message });
  }
}

module.exports = {
  RegisterAdmin,
  Login,
  getAdmin,
  getDashboard,
  getAdminPosts,
  updateAdminPost,
  deleteAdminPost,
  getAdminUsers,
  getAdminUserProfile,
  updateAdminUser,
  deleteAdminUser,
};
