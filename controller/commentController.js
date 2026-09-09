const Article = require("../model/article");
const Comment = require("../model/comment");
const UserProfile = require("../model/userProfile");
const Notification = require("../model/notification");

async function attachCommenterProfile(comments) {
  const userIds = comments.map((comment) => comment.user?._id).filter(Boolean);
  const profiles = await UserProfile.find({ user: { $in: userIds } }).select("user name username profilePicture").lean();
  const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
  comments.forEach((comment) => {
    if (comment.user) comment.user = { ...comment.user, profile: profileByUser.get(String(comment.user._id)) || null };
  });
  return comments;
}

async function getComments(req, res) {
  try {
    const comments = await Comment.find({ article: req.params.id })
      .populate("user", "email")
      .sort({ createdAt: -1 });
    await attachCommenterProfile(comments);
    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function addComment(req, res) {
  try {
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ message: "Comment is required" });
    if (content.length > 500) return res.status(400).json({ message: "Comment cannot exceed 500 characters" });

    const article = await Article.findOne({ _id: req.params.id, status: "published" });
    if (!article) return res.status(404).json({ message: "Article not found" });

    const comment = await Comment.create({ article: article._id, user: req.blogUser._id, content });
    if (String(article.author) !== String(req.blogUser._id)) {
      const commenterName = req.blogUser.email.split("@")[0];
      await Notification.create({
        recipientUser: article.author,
        type: "comment",
        actor: req.blogUser._id,
        article: article._id,
        comment: comment._id,
        message: `${commenterName} commented on your post.`,
      });
    }
    await comment.populate("user", "email");
    await attachCommenterProfile([comment]);
    return res.status(201).json({ comment });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

module.exports = { getComments, addComment };