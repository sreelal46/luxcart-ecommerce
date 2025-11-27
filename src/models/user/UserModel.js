const mongoose = require("mongoose");
const defaultImage = process.env.DEFAULT_PROFILE_IMAGE_URL;
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

    profileImage_url: {
      type: String,
      default: defaultImage,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Optional fields for your project
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isReferred: { type: Boolean, default: false },
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple docs without this field
    },
    referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
