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
const Referral = require("../../models/user/referral.Model");
const Wallet = require("../../models/user/walletsModel");

//login page
const loadLoginPage = (req, res) => {
  res.status(OK).render("user/auth/login");
};

//signup page
const loadSignUpPage = (req, res) => {
  res.status(OK).render("user/auth/signUp");
};

//load forgot password first step email entering page
const loadEmailPage = (req, res) => {
  res.status(OK).render("user/auth/verify-email");
};
//load forgot page
const loadForgotPassPage = (req, res) => {
  res.status(OK).render("user/auth/change-password");
};

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
    const hashedPassword = await bcrypt.hash(password, salt);
    function generateReferralCode(name) {
      return (
        name.slice(0, 3).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase()
      );
    }
    // 3. Generate user's own referral code
    let newReferralCode;
    let codeExists = true;

    while (codeExists) {
      newReferralCode = generateReferralCode(name);
      codeExists = await User.findOne({ referralCode: newReferralCode });
    }

    // 4. Create user object
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
    });
    await Wallet.create({
      userId: newUser._id,
    });
    let referrer = null;

    // 5. If referral code provided
    if (referralCode) {
      referrer = await User.findOne({
        referralCode,
        isActive: true,
      });

      if (referrer) {
        newUser.referredBy = referrer._id;
      }
    }
    // console.log(req.body);
    // if (!referrer) {
    //   return res
    //     .status(NOT_FOUND)
    //     .json({ success: false, alert: "Invalid Referral Code" });
    // }
    // 6. Save user
    await newUser.save();

    // 7. Create referral record (NO REWARD HERE)
    if (referrer) {
      await Referral.create({
        referrer: referrer._id,
        referredUser: newUser._id,
        status: "pending",
      });
    }

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
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Email not found." });

    //checking user is blocked
    if (user.isBlocked)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Your account has been Blocked." });

    if (user.authProvider === "google")
      return res.status(FORBIDDEN).json({
        success: false,
        alert:
          "This email is registered with Google. Please use 'Continue with Google'.",
      });

    const compare = await bcrypt.compare(password, user.password);
    if (!compare)
      return res
        .status(UNAUTHORIZED)
        .json({ success: false, alert: "Invalid email or password" });
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage_url: user.profileImage_url,
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

//setting new password
const forgotPassword = async (req, res, next) => {
  try {
    //finding user
    const userId = req.session.userId;
    const user = await User.findById({ _id: userId });

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
      { $set: { password: NewHashPassword } },
    );

    //saving success message
    req.session.userPasswordChanged = true;

    req.session.save(() =>
      res.status(OK).json({
        success: true,
        redirect: "/login",
      }),
    );
  } catch (error) {
    console.error("Error from forgotPassword", error);
    next(error);
  }
};

module.exports = {
  createUser,
  logoutPage,
  forgotPassword,
  verifyUser,
  loadLoginPage,
  loadSignUpPage,
  loadEmailPage,
  loadForgotPassPage,
};
