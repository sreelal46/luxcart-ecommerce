require("dotenv").config();
const bcrypt = require("bcrypt");
const OTPSchems = require("../models/common/OTPModal");
const nodemailer = require("nodemailer");
const emailVerificationHTML = require("./emailVerificationMSG");
const forgotPasswordHTML = require("./ForgotPasswordMSG");

const emailSending = async (email, userId, typeOfMail) => {
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

    //email content chnaging dynamically
    const type = typeOfMail;
    const htmlContent =
      type === "verification"
        ? emailVerificationHTML(otp)
        : forgotPasswordHTML(otp);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // or 587
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password if 2FA enabled
      },
    });

    // Email content
    const mailOptions = {
      from: `"LuxCart" <${process.env.GMAIL_USER}>`, // sender name and email
      to: email,
      subject:
        type === "verification"
          ? "Email Verification OTP"
          : "Reset Your Password OTP",
      text: `Your OTP is ${otp}`,
      html: htmlContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    return false;
  }
};

module.exports = emailSending;
