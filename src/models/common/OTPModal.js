const mongoose = require("mongoose");
const User = require("../user/UserModel");

const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const OTP = mongoose.model("otpCode", otpSchema);

module.exports = OTP;
