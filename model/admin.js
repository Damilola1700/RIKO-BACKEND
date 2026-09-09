const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       
      lowercase: true,    
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    otp: {
      type:Number,
    },
    otpTiming: {
      type:Date
    },
    verified: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Admin', adminSchema);
