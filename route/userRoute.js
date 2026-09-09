const express = require("express");
const { Register, Login, getUsers } = require("../controller/userController");

const authenticate = require("../middleware/authUser");
const router = express.Router();

router.get("/users", authenticate, getUsers);
router.post("/register", Register);
router.post("/login", Login);

module.exports = router;