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

//creating new user and verifying existingn that user and sending OTP
const createUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, referralCode } = req.body;

    //finding exixsting user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(CONFLICT)
        .render("user/signUp", { alert: "Email id alrady taken" });

    //creating new user
    const newUser = new User({ name, email, password, referralCode });
    await newUser.save();

    //Email sending with OTP
    await emailSending(email, newUser.id, "verification");

    //OTP sended userID and veryfication type
    req.session.userId = newUser.id;
    req.session.verifyType = "verification";

    //sending response status code 201
    res.status(CREATED).redirect("/verify-otp");
  } catch (error) {
    //if any error
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .render("user/signUp", { alert: "Server error" });
  }
};

//sending OTP for forgott password
const sendOTP = async (req, res) => {
  try {
    //finding user
    const email = req.body.email;
    const user = await User.findOne({ email });

    //if user not found
    if (!user)
      return res
        .status(NOT_FOUND)
        .render("user/verify-email", { alert: "Invalid email" });

    //send OTP to user
    await emailSending(email, user.id, "ForgotPassword");

    //OTP sended userID and veryfication type
    req.session.userId = user.id;
    req.session.verifyType = "ForgotPassword";

    res.status(CREATED).redirect("/verify-otp");
  } catch (error) {
    console.log(error);
    res.status(INTERNAL_SERVER_ERROR).redirect("/verify-otp");
  }
};

//verifing otp for creating user and forgott password OTP
const verifyOTP = async (req, res) => {
  try {
    //object to string OTP
    const otp = Object.values(req.body).join("");

    //finding OTP sender
    const userId = req.session.userId;
    const findUserOTP = await OTP.findOne({ userId }).sort({ createdAt: -1 });

    //OTP is expired or not
    if (!findUserOTP)
      return res
        .status(GONE)
        .render("user/verify-otp", { alert: "Your OTP has expired" });

    //compairing hashed otp
    const verifyOTP = await bcrypt.compare(otp, findUserOTP.otp);
    console.log("OTP verification is:", verifyOTP);

    //verifyOTP if not true
    if (!verifyOTP)
      return res
        .status(UNAUTHORIZED)
        .render("user/verify-otp", { alert: "Invalid OTP.Please try again." });

    //activating user and delete the expireAt field
    if (req.session.verifyType === "verification") {
      await User.updateOne(
        { _id: userId },
        { $set: { isActive: true }, $unset: { expireAt: "" } }
      );
    }

    //success message
    if (req.session.verifyType === "verification") {
      req.session.signSuccess = "Account created successfully!";
    }

    //redirect to correct route
    if (req.session.verifyType === "verification") {
      res.status(CREATED).redirect("/login");
    } else {
      res.status(OK).redirect("/forgot-password");
    }
  } catch (error) {
    console.log(error);
    res.status(INTERNAL_SERVER_ERROR).redirect("/login");
  }
};

const forgotPassword = async (req, res) => {
  try {
    req.session.forgotSuccess = "Password changed successfully";
    console.log(req.session.userId);
    console.log(req.body);
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

module.exports = { createUser, sendOTP, verifyOTP, forgotPassword };
