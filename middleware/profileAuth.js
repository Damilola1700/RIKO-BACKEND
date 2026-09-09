const user = require("../model/user");
const jwt = require("jsonwebtoken");

const profileAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await user.findById(decoded.id).select("-password");

    if (!currentUser) return res.status(404).json({ message: "User not found" });

    req.user = currentUser;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = profileAuth;
