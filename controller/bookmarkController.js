const Bookmark = require("../model/bookmark");

async function getBookmarks(req, res) {
  try {
    const bookmarks = await Bookmark.find({ user: req.blogUser._id })
      .populate({ path: "article", populate: { path: "author", select: "email" } })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ bookmarks });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load bookmarks", error: error.message });
  }
}

async function saveBookmark(req, res) {
  try {
    const bookmark = await Bookmark.create({ user: req.blogUser._id, article: req.params.articleId });
    return res.status(201).json({ message: "Post saved", bookmark });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ message: "Post already saved" });
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid post" });
    return res.status(500).json({ message: "Unable to save post", error: error.message });
  }
}

async function removeBookmark(req, res) {
  await Bookmark.deleteOne({ user: req.blogUser._id, article: req.params.articleId });
  return res.status(200).json({ message: "Post removed from bookmarks" });
}

async function getBookmarkStatus(req, res) {
  const bookmark = await Bookmark.exists({ user: req.blogUser._id, article: req.params.articleId });
  return res.status(200).json({ bookmarked: Boolean(bookmark) });
}

module.exports = { getBookmarks, saveBookmark, removeBookmark, getBookmarkStatus };