const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
     type: String,
    required: true, 
    trim: true, 
    maxlength: 140 
 },
    content: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, trim: true },
    status: { type: String, enum: ["draft", "published", "pending"], default: "published" },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);