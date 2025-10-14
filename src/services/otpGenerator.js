require("dotenv").config();
const bcrypt = require("bcrypt");
const OTPSchems = require("../models/common/OTPModal");

const otpGenerator = async (userId) => {
  try {
    //OTP generating
    const otp = Math.floor(100000 + Math.random() * 900000);

    //OTP hashing
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOTP = await bcrypt.hash(otp.toString(), salt);

    //expire time
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    //creating OTP document
    const newOTP = new OTPSchems({
      userId,
      otp: hashedOTP,
      expiresAt: expiryTime,
    });

    await newOTP.save();
    //passing OTP
    return otp;
  } catch (error) {
    console.log(error);
  }
};

module.exports = otpGenerator;
