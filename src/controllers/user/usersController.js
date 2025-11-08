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
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, referralCode } = req.body;

    //finding exixsting user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "Email id alrady taken" });

    //comparing password
    if (password !== confirmPassword)
      return res
        .status(CONFLICT)
        .json({ success: false, alert: "Password Mismatch" });

    //hashing password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashPassword = await bcrypt.hash(password, salt);

    //creating new user
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      // referralCode,
    });
    await newUser.save();

    //Email sending with OTP
    await emailSending(email, newUser.id, "verification");

    //OTP sended userID and veryfication type
    req.session.userId = newUser.id;
    req.session.email = email;
    req.session.verifyType = "verification";

    //sending response status code 201
    res.status(CREATED).json({ success: true, redirect: "/verify-otp" });
  } catch (error) {
    console.error("Error from creating user", error);
    next(error);
  }
};

//user verification
const verifyUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, alert: "Email not found" });

    //checking user is blocked
    if (user.isBlocked)
      return res
        .status(404)
        .json({ success: false, alert: "Your Account Has Been Blocked" });

    if (user.authProvider === "google")
      return res.status(403).json({
        success: false,
        alert:
          "This email is registered with Google. Please use 'Sign in with Google'.",
      });

    const compare = await bcrypt.compare(password, user.password);
    if (!compare)
      return res
        .status(401)
        .json({ success: false, alert: "Invalid email or password" });

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
    };

    req.session.save((err) => {
      if (err) return next(err);

      res.status(200).json({ success: true, redirect: "/homepage" });
    });
  } catch (error) {
    console.error("Error from verifyUser", error);
    next(error);
  }
};

//logout destroying session
const logoutPage = (req, res) => {
  //session destroying
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/homepage"); // or admin/dashboard
    }
    res.clearCookie("user.sid"); // or "admin.sid"
    res.status(OK).redirect("/");
  });
};

//sending OTP for forgott password
const sendOTP = async (req, res, next) => {
  try {
    //finding user
    const email = req.body.email;
    const user = await User.findOne({ email });

    //if user not found
    if (!user)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Email not Found" });

    //send OTP to user
    await emailSending(email, user.id, "ForgotPassword");

    //OTP reciver userID and veryfication type
    req.session.userId = user.id;
    req.session.email = email;
    req.session.verifyType = "ForgotPassword";
    req.session.userPasswordChanged = false;

    req.session.save(() =>
      res.status(CREATED).json({ success: true, redirect: "/verify-otp" })
    );
  } catch (error) {
    console.error("Error from forgot password email otp", error);
    next(error);
  }
};

//verifing otp for creating user and forgott password
const verifyOTP = async (req, res, next) => {
  try {
    //object to string OTP
    const otp = Object.values(req.body).join("");

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
    console.log("OTP verification is:", verifyOTP);

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
        authProvider: user.authProvider,
      };
      return req.session.save(() =>
        res.status(CREATED).json({ success: true, redirect: "/homepage" })
      );
    }

    if (verifyType === "ForgotPassword") {
      req.session.userPasswordChanged = false;
      return res
        .status(OK)
        .json({ success: true, redirect: "/forgot-password" });
    }
  } catch (error) {
    console.error("Error from OTP verification", error);
    next(error);
  }
};

//setting new password
const forgotPassword = async (req, res, next) => {
  try {
    //finding user
    const userId = req.session.userId;
    const user = await User.findById({ _id: userId });
    console.log(user);

    //if user not found
    if (!user)
      return res.status(UNAUTHORIZED).json({
        success: false,
        alert: "User not found..Please try again later",
      });

    const { newPassword, confirmPassword } = req.body;

    //cpmparing password
    if (newPassword !== confirmPassword)
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Password Mismatch",
      });

    //hashing new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const NewHashPassword = await bcrypt.hash(newPassword, salt);

    //updating new password
    await User.updateOne(
      { _id: user.id },
      { $set: { password: NewHashPassword } }
    );

    //saving success message
    req.session.userPasswordChanged = true;

    req.session.save(() =>
      res.status(OK).json({
        success: true,
        redirect: "/login",
      })
    );
  } catch (error) {
    console.error("Error from forgotPassword", error);
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
  createUser,
  sendOTP,
  verifyOTP,
  logoutPage,
  forgotPassword,
  verifyUser,
  resendOTP,
};
