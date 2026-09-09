const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const user = require("../model/user");
const admin = require("../model/admin");

dotenv.config();

const MONGODB = process.env.MONGODB_URL

async function ensureDefaultAdmin() {
  const email = "lovethdamilola206@gmail.com";
  const password = "loveth111";

  const existingAdmin = await admin.findOne({ email: email.toLowerCase() });

  if (existingAdmin) {
    const isPasswordCorrect = await bcrypt.compare(password, existingAdmin.password);
    if (!isPasswordCorrect) {
      existingAdmin.password = await bcrypt.hash(password, 10);
      existingAdmin.verified = true;
      await existingAdmin.save();
    }
    return;
  }

  await admin.create({
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    verified: true,
  });
}

const connectDB = async() => {
    try {
        await mongoose.connect(MONGODB)

        for (const model of [user, admin]) {
            try {
                await model.collection.dropIndex("otp_1");
            } catch (error) {
                if (error.codeName !== "IndexNotFound" && error.code !== 27) {
                    throw error;
                }
            }
        }

        await ensureDefaultAdmin();
        console.log("Database Successfully Fetched");
        
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = connectDB;