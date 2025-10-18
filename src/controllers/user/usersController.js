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
        .render("user/signUp", { alert: "Email id alrady taken" });

    //comparing password
    if (password !== confirmPassword)
      return res
        .status(CONFLICT)
        .render("user/signUp", { alert: "Password miss match" });

    //hashing password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashPassword = await bcrypt.hash(password, salt);

    //creating new user
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      referralCode,
    });
    await newUser.save();

    //Email sending with OTP
    await emailSending(email, newUser.id, "verification");

    //OTP sended userID and veryfication type
    req.session.userId = newUser.id;
    req.session.email = email;
    req.session.verifyType = "verification";

    //sending response status code 201
    res.status(CREATED).redirect("/verify-otp");
  } catch (error) {
    next(error);
  }
};

//user verification
const verifyUser = async (req, res, next) => {
  try {
    //finding user
    const { email, password } = req.body;
    console.log("Long email and password:", req.body);
    const user = await User.findOne({ email });
    console.log("from user verification", user);

    //if user not found
    if (!user)
      return res
        .status(NOT_FOUND)
        .render("user/login", { alert: "Email not found" });

    if (user.authProvider === "google")
      return res.status(FORBIDDEN).render("user/login", {
        alert: `This email is registered with Google. Please use 'Sign in with Google'.`,
      });

    //compaire password
    const compare = await bcrypt.compare(password, user.password);

    if (!compare)
      return res
        .status(UNAUTHORIZED)
        .render("user/login", { alert: "Invalid email or password" });

    //storing user data to session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
    };
    console.log("Verify user controller :", req.session.user);
    req.session.save(() => res.status(OK).redirect("/homepage"));
  } catch (error) {
    next(error);
  }
};

//logout destroying session
const logoutPage = (req, res) => {
  //session destroying
  req.session.destroy((error) => {
    if (error) {
      console.log("Error session destroying:", error);
      next();
    } else {
      res.clearCookie("luxcart.sid");
      console.log("From logout controller session destroy successfully");
      return res.status(OK).redirect("/");
    }
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
        .render("user/verify-email", { alert: "Invalid email" });

    //send OTP to user
    await emailSending(email, user.id, "ForgotPassword");

    //OTP reciver userID and veryfication type
    req.session.userId = user.id;
    req.session.email = email;
    req.session.verifyType = "ForgotPassword";

    res.status(CREATED).redirect("/verify-otp");
  } catch (error) {
    next(error);
  }
};

//verifing otp for creating user and forgott password OTP
const verifyOTP = async (req, res, next) => {
  try {
    //object to string OTP
    const otp = Object.values(req.body).join("");

    //finding OTP sender
    const userId = req.session.userId;
    const verifyType = req.session.verifyType;
    console.log("user id:", userId);
    console.log("type of verification :", req.session.verifyType);
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

    // verifying user
    if (verifyType === "verification") {
      await User.updateOne({ _id: userId }, { $set: { isVerified: true } });
    }

    //success message redirect to correct route
    if (verifyType === "verification") {
      req.session.signSuccess = "Account created successfully!";
      return res.status(CREATED).redirect("/login");
    }

    if (verifyType === "ForgotPassword") {
      return res.status(OK).redirect("/forgot-password");
    }
  } catch (error) {
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
      return res
        .status(UNAUTHORIZED)
        .render("user/forgot-password", { alert: "User not found" });

    const { newPassword, confirmPassword } = req.body;

    //cpmparing password
    if (newPassword !== confirmPassword)
      return res
        .status(BAD_REQUEST)
        .render("user/forgot-password", { alert: "Password miss match" });

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
    req.session.forgotSuccess = "Password changed successfully";

    req.session.save(() => res.status(OK).redirect("/login"));
  } catch (error) {
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
    console.log("Error fom resend OTP");
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
