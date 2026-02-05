const {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  GONE,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
require("dotenv").config();
const User = require("../../models/user/UserModel");
const bcrypt = require("bcrypt");
const emailSending = require("../../services/sendEmail");
const OTP = require("../../models/common/OTPModal");

const loadSend_OTP_Page = (req, res) => {
  res.status(OK).render("user/auth/verify-email");
};

const loadVerify_OTP_Page = (req, res) => {
  res.status(OK).render("user/auth/verify-otp");
};

//sending OTP for forgott password/changing email
const sendOTP = async (req, res, next) => {
  try {
    //finding user
    const email = req.body.email;
    const verification = req.body.verification;
    const user = await User.findOne({ email });

    //if user not found
    if (!user)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Email not Found" });

    if (user.authProvider === "google")
      return res.status(NOT_FOUND).json({
        success: false,
        alert:
          "This email is registered with Google. Please use 'Continue with Google'.",
      });

    //send OTP to user
    await emailSending(
      email,
      user.id,
      verification ? verification : "ForgotPassword",
    );

    //OTP reciver userID and veryfication type
    req.session.userId = user.id;
    req.session.email = email;
    req.session.verifyType = verification ? verification : "ForgotPassword";
    req.session.userPasswordChanged = false;

    if (verification)
      return req.session.save(() =>
        res.status(CREATED).json({ success: true }),
      );
    req.session.save(() =>
      res.status(CREATED).json({ success: true, redirect: "/verify-otp" }),
    );
  } catch (error) {
    console.error("Error from changin email/forgot password email otp", error);
    next(error);
  }
};

//verifing otp for creating user and forgott password
const verifyOTP = async (req, res, next) => {
  try {
    //saving OTP
    let otp;
    if (req.body.code) {
      otp = req.body.code;
    } else {
      //object to string OTP
      otp = Object.values(req.body).join("");
    }
    const targetEmail = req.body.targetEmail;

    //finding OTP sender
    const userId = req.session.userId;
    const verifyType = req.session.verifyType;
    console.log("user id:", userId);
    console.log("type of verification :", req.session.verifyType);
    const user = await User.findById(userId);
    const findUserOTP = await OTP.findOne({ userId }).sort({ createdAt: -1 });

    //OTP is expired or not
    if (!findUserOTP)
      return res
        .status(GONE)
        .json({ success: false, alert: "Your OTP has expired" });

    //compairing hashed otp
    const verifyOTP = await bcrypt.compare(otp, findUserOTP.otp);

    //verifyOTP if not true
    if (!verifyOTP)
      return res
        .status(UNAUTHORIZED)
        .json({ success: false, alert: "Invalid OTP.Please try again." });

    // verifying user
    if (verifyType === "verification") {
      await User.updateOne({ _id: userId }, { $set: { isVerified: true } });
    }

    //success message redirect to correct route
    if (verifyType === "verification") {
      req.session.signSuccess = "Account created successfully!";
      req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage_url: user.profileImage_url,
        authProvider: user.authProvider,
      };

      return req.session.save(() =>
        res.status(CREATED).json({ success: true, redirect: "/homepage" }),
      );
    }

    if (verifyType === "ForgotPassword") {
      req.session.userPasswordChanged = false;
      return res
        .status(OK)
        .json({ success: true, redirect: "/forgot-password" });
    }
    if (verifyType === "emailChanging") {
      await User.updateOne({ _id: userId }, { $set: { email: targetEmail } });
      return res
        .status(OK)
        .json({ success: true, redirect: "/account/profile/edit-profile" });
    }
  } catch (error) {
    console.error("Error from OTP verification", error);
    next(error);
  }
};
//resend OTP
const resendOTP = async (req, res, next) => {
  try {
    //if the user not found
    if (!req.session.email) {
      req.session.resendOTP = "Somthing wrog";
      return res.status(NOT_FOUND).redirect("/forgot-password-otp");
    }

    //geting user data
    const { userId, email, verifyType } = req.session;

    //resending otp
    await emailSending(email, userId, verifyType);

    //success message
    req.session.resendOTP = "Your OTP has been resent successfully.";
    res.status(OK).redirect("/forgot-password-otp");
  } catch (error) {
    console.log("Error fom resend OTP", error);
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
  loadSend_OTP_Page,
  loadVerify_OTP_Page,
};
