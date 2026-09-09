const express = require("express");
const { createArticle, getArticles, getArticle } = require("../controller/articleController");
const { getComments, addComment } = require("../controller/commentController");
const authenticate = require("../middleware/authUser");
const upload = require("../middleware/upload");
const optionalAuthUser = require("../middleware/optionalAuthUser");

const router = express.Router();

router.get("/", getArticles);
router.post("/", authenticate, upload.single("image"), createArticle);
router.get("/:id", optionalAuthUser, getArticle);
router.get("/:id/comments", getComments);
router.post("/:id/comments", authenticate, addComment);

module.exports = router;