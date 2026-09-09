const express = require("express");
const router = express.Router();

const profileAuth = require("../middleware/profileAuth");
const { getProfile, updateProfile, followUser, unfollowUser, getRecommendedCreators } = require("../controller/userProfileC");
const upload = require("../middleware/upload")
const optionalAuthUser = require("../middleware/optionalAuthUser");


router.get("/", profileAuth, getProfile);
router.get("/creators", optionalAuthUser, getRecommendedCreators);
router.put("/",profileAuth, upload.single("profilePicture"), updateProfile);
router.post("/follow/:userId", profileAuth, followUser);
router.delete("/follow/:userId", profileAuth, unfollowUser);

module.exports = router;
