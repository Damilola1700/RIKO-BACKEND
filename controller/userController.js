const user = require("../model/user");
const { sendMail, createOtpEmail } = require("../service/nodemail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");
const Notification = require("../model/notification");
const dotenv = require("dotenv");
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;

let subjectForNewUser = "Complete Your Registration"

async function Register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password ) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await user.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists,kindly register with another email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpTiming = new Date();
    otpTiming.setMinutes(otpTiming.getMinutes() + 4);

    const newUser = new user({
      email: email,
      password: hashedPassword,
      otp: otp,
      otpTiming: otpTiming,
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

    //  nodemail message

    const otpEmail = createOtpEmail({ otp, expiresInMinutes: 4 });
    const mailResult = await sendMail({
      to: email,
      subject: subjectForNewUser,
      ...otpEmail,
    });

    if (!mailResult.success) {
      return res.status(502).json({
        message: "Your account was created, but we could not deliver the OTP. Please request a new OTP.",
      });
    }

    res.status(200).json({
      message: "User registered successfully",
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
    const isUser = await user.findOne({ email: email });

    if (!isUser) {
      return res.status(404).send("Incorrect Email");
    }

    if (!isUser.verified) {
      return res.status(403).json({ message: "Please verify your email before signing in" });
    }

    const comparePassword = await bcrypt.compare(password, isUser.password);

    if (!comparePassword) {
      return res.status(403).send("Incorrect Password");
    }

    const token = jwt.sign({ id: isUser.id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successfully", token });
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

async function verifyOTP(req, res) {
  try {
    const { otp, email } = req.body;

    if (!otp || !email) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const findUser = await user.findOne({ email: email });

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!findUser.otpTiming || findUser.otpTiming < new Date()) {
      return res.status(403).json({ message: "OTP expired. Request a new OTP." });
    }

    if (Number(otp) !== findUser.otp) {
      return res.status(403).json({ message: "Invalid OTP" });
    }

    findUser.verified = true;
    findUser.otp = undefined;
    findUser.otpTiming = undefined;
    await findUser.save();

    return res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function resendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const findUser = await user.findOne({ email });

    if (!findUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (findUser.verified) {
      return res.status(400).json({
        message: "User is already verified",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

   
    const otpTiming = new Date();
    otpTiming.setMinutes(otpTiming.getMinutes() + 4);

    findUser.otp = otp;
    findUser.otpTiming = otpTiming;

    await findUser.save();

    const otpEmail = createOtpEmail({ otp, expiresInMinutes: 4 });
    const mailResult = await sendMail({
      to: findUser.email,
      subject: "Your New OTP",
      ...otpEmail,
    });

    if (!mailResult.success) {
      return res.status(502).json({ message: "We could not deliver the OTP. Please try again." });
    }

    return res.status(200).json({
      message: "A new OTP has been sent successfully.",
      user: { id: findUser._id, email: findUser.email },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      

    });
  }
}


module.exports = { Register, Login, getUsers,  verifyOTP , resendOTP};
