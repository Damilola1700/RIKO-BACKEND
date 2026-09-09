const user = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");
const Notification = require("../model/notification");
const dotenv = require("dotenv");
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;

async function Register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password ) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await user.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists, kindly register with another email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new user({
      email: email,
      password: hashedPassword,
      verified: true,
    });

    await newUser.save();
    const admins = await Admin.find().select("_id").lean();
    if (admins.length) {
      await Notification.insertMany(admins.map((admin) => ({
        recipientAdmin: admin._id,
        type: "signup",
        actor: newUser._id,
        message: `${newUser.email} signed up for RIKO.`,
      })));
    }

    res.status(201).json({
      message: "User registered successfully. Please sign in.",
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


async function Login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).send("fields required");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const isDefaultAdmin = normalizedEmail === "lovethdamilola206@gmail.com";

    if (isDefaultAdmin) {
      const adminUser = await Admin.findOne({ email: normalizedEmail });
      if (!adminUser) {
        return res.status(404).json({ message: "Incorrect Email" });
      }

      const comparePassword = await bcrypt.compare(password, adminUser.password);
      if (!comparePassword) {
        return res.status(403).json({ message: "Incorrect Password" });
      }

      const token = jwt.sign({ id: adminUser._id, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
      return res.status(200).json({
        message: "Admin login successfully",
        token,
        role: "admin",
        redirectTo: "/admin/home",
      });
    }

    const isUser = await user.findOne({ email: normalizedEmail });

    if (!isUser) {
      return res.status(404).send("Incorrect Email");
    }

    const comparePassword = await bcrypt.compare(password, isUser.password);

    if (!comparePassword) {
      return res.status(403).send("Incorrect Password");
    }

    const token = jwt.sign({ id: isUser.id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successfully", token, role: "user" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


async function getUsers(req, res) {
  try {
    const allUser = await user.find();
    res.status(200).json({ message: "all user fetched successfully", allUser });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

// async function updateUser(req, res) {
//   try {
//     const { id } = req.params;
//     const { name, phone } = req.body;

//     if (!id) {
//       res.status(400).send("User Id is required");
//     }

//     const updateuser = await user.findByIdAndUpdate(
//       id,
//       { name, phone },
//       { new: true },
//     );

//     if (!updateuser) {
//       res.status(404).send("User NoT FounD");
//     }

//     res.status(200).json({ message: "User updated succesfully", updateuser });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// }

module.exports = { Register, Login, getUsers };
