const mongoose = require("mongoose");
const dotenv = require("dotenv");
const user = require("../model/user");
const admin = require("../model/admin");

dotenv.config();

const MONGODB = process.env.MONGODB_URL

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

        console.log("Database Successfully Fetched");
        
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = connectDB;