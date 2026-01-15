const mongoose = require("mongoose");
const defaultImage = process.env.DEFAULT_PROFILE_IMAGE_URL;
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: Number,
    },

    dob: {
      type: String,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },

    googleId: {
      type: String,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    profileImage_url: {
      type: String,
      default: defaultImage,
    },

    /* ---------------- REFERRAL ---------------- */

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ---------------- WALLET ---------------- */

    walletBalance: {
      type: Number,
      default: 0,
    },

    totalSpended: {
      type: Number,
      default: 0,
    },

    /* ---------------- STATUS FLAGS ---------------- */

    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
