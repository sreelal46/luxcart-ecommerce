require("dotenv").config();
const bcrypt = require("bcrypt");
const OTPSchems = require("../models/common/OTPModal");
const nodemailer = require("nodemailer");
const emailVerificationHTML = require("./emailVerificationMSG");
const forgotPasswordHTML = require("./ForgotPasswordMSG");
const emailChangingHTML = require("./emailChangingVerifivationMSG"); // keep if file name is that, else fix filename

const emailSending = async (email, userId, typeOfMail) => {
  try {
    // 1) generate numeric 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 2) hash OTP before storing
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedOTP = await bcrypt.hash(otp.toString(), salt);

    // 3) expiry time (5 minutes)
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // Optional: remove previous OTPs for this user & type (avoid duplicates)
    try {
      await OTPSchems.deleteMany({ userId, type: typeOfMail });
    } catch (e) {
      // not critical — continue
      console.warn("Could not clean old OTPs:", e.message);
    }

    // 4) create OTP document (include type and email if schema allows)
    const newOTP = new OTPSchems({
      userId,
      otp: hashedOTP,
      expiresAt: expiryTime,
      type: typeOfMail,
      email, // useful if you need to validate that OTP was sent for this email
    });
    await newOTP.save();

    // 5) choose HTML content and subject
    let htmlContent;
    let subject;

    switch (typeOfMail) {
      case "verification":
        htmlContent = emailVerificationHTML(otp);
        subject = "LuxCart — Email Verification OTP";
        break;

      case "ForgotPassword":
        htmlContent = forgotPasswordHTML(otp);
        subject = "LuxCart — Password Reset OTP";
        break;

      case "emailChanging":
        htmlContent = emailChangingHTML(otp);
        subject = "LuxCart — Confirm Email Change";
        break;

      default:
        throw new Error("Invalid email type");
    }

    // 6) transporter (Gmail SMTP). Use App Password for accounts with 2FA.
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Optional: verify transporter quickly (non-blocking useful in dev)
    try {
      await transporter.verify();
    } catch (e) {
      console.warn("Mailer verify failed:", e.message);
    }

    // 7) mail payload
    const mailOptions = {
      from: `"LuxCart" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      html: htmlContent,
    };

    // 8) send
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    return true;
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    return false;
  }
};

module.exports = emailSending;
