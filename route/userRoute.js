const express = require("express");
const {Register, Login, getUsers,verifyOTP , resendOTP} = require("../controller/userController");

const authenticate = require("../middleware/authUser");
const router = express.Router();

router.get("/users", authenticate, getUsers);
router.post("/register", Register);
// router.put("/user/:id", updateUser);
router.post("/login", Login);
router.post("/verifyotp", verifyOTP);
router.post("/resendotp", resendOTP);

module.exports = router;