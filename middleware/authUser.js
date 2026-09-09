const blogUser = require("../model/user");
const jwt = require("jsonwebtoken");


const authUser = async(req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await blogUser.findById(decoded.id).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        req.blogUser = user;

        next();
    } catch (error) {
        res.status(401).send({message: "Unauthorized",})
    }
}

module.exports = authUser;