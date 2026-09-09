const jwt = require("jsonwebtoken");
const user = require("../model/user");

const optionalAuthUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.blogUser = await user.findById(decoded.id).select("_id");
  } catch {
    req.blogUser = null;
  }

  next();
};

module.exports = optionalAuthUser;