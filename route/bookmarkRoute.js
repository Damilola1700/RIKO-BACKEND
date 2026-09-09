const express = require("express");
const authenticate = require("../middleware/authUser");
const { getBookmarks, saveBookmark, removeBookmark, getBookmarkStatus } = require("../controller/bookmarkController");

const router = express.Router();
router.get("/", authenticate, getBookmarks);
router.get("/:articleId", authenticate, getBookmarkStatus);
router.post("/:articleId", authenticate, saveBookmark);
router.delete("/:articleId", authenticate, removeBookmark);

module.exports = router;