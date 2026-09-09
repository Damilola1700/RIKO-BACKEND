const Article = require("../model/article");
const UserProfile = require("../model/userProfile");
const cloudinary = require("../config/cloudinary");
const Admin = require("../model/admin");
const Notification = require("../model/notification");

async function attachAuthorProfiles(articles) {
  const authorIds = articles.map((article) => article.author?._id).filter(Boolean);
  const profiles = await UserProfile.find({ user: { $in: authorIds } }).select("user name username profilePicture").lean();
  const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));

  articles.forEach((article) => {
    if (article.author) article.author = { ...article.author, profile: profileByUser.get(String(article.author._id)) || null };
  });
  return articles;
}

async function createArticle(req, res) {
  try {
    const { title, content, category } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const articleData = {
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || "General",
      author: req.blogUser._id,
      status: "published",
    };

    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "riko/articles",
      });
      articleData.image = uploadResult.secure_url;
    }

    const article = await Article.create(articleData);
    const admins = await Admin.find().select("_id").lean();
    if (admins.length) {
      await Notification.insertMany(admins.map((admin) => ({
        recipientAdmin: admin._id,
        type: "post",
        actor: req.blogUser._id,
        article: article._id,
        message: `${req.blogUser.email} published a new post: ${article.title}`,
      })));
    }

    return res.status(200).json({ message: "Article published successfully", article });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function getArticles(req, res) {
  try {
    const { search, category } = req.query;
    const filter = { status: "published" };

    if (category && category !== "All") filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];

    const articles = await Article.find(filter)
      .populate("author", "email")
      .sort({ createdAt: -1 });
    await attachAuthorProfiles(articles);

    return res.status(200).json({ articles });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function getArticle(req, res) {
  try {
    const article = await Article.findOne({ _id: req.params.id, status: "published" });

    if (!article) return res.status(404).json({ message: "Article not found" });

    if (req.blogUser && !article.viewedBy.some((viewerId) => viewerId.equals(req.blogUser._id))) {
      article.viewedBy.push(req.blogUser._id);
      article.views = article.viewedBy.length;
      await article.save();
    }

    await article.populate("author", "email");
    await attachAuthorProfiles([article]);
    return res.status(200).json({ article });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

module.exports = { createArticle, getArticles, getArticle };