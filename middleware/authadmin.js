const admin = require("../model/admin");
const jwt = require("jsonwebtoken");

const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided",});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const findAdmin = await admin.findById(decoded.id).select("-password");

    if (!findAdmin) {
      return res.status(404).json({ message: "Supplier not found",});
    }

    req.admin = findAdmin;

    next();
  } catch (error) {
    return res.status(401).json({message: "Unauthorized",});
  }
};

module.exports = adminAuth;