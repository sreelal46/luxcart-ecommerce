const mongoose = require("mongoose");

// Admin Schema
const adminSchema = new mongoose.Schema(
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
      required: [true, "Please enter a password"],
      minlength: 8,
    },
    phone: {
      type: String,
      trim: true,
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    websiteLogo: {
      type: String,
      default: null,
    },
    bannerMedia: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
          default: "",
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
