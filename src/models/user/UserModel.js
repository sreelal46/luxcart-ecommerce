const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Only require password if googleId is not present
        return !this.googleId;
      },
    },
    googleId: {
      type: String, // <-- add this field
    },
    profileImage_url: {
      type: String,
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isReferred: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min later
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
