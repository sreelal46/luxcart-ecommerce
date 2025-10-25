const express = require("express");
const route = express.Router();

const {
  loadLandingPage,
  loadHomePage,
  loadLoginPage,
  loadSignUpPage,
  loadSend_OTP_Page,
  loadVerify_OTP_Page,
  loadEmailPage,
  loadForgotPassPage,
  loadCarCollection,
} = require("../controllers/user/pageLoadController");

const {
  createUser,
  verifyUser,
  logoutPage,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resendOTP,
} = require("../controllers/user/usersController");

const {
  isLogin,
  checkSession,
  isPasswordChange,
} = require("../middlewares/user/userAuth");

//User Auth
route.get("/", loadLandingPage);
route.get("/homepage", checkSession, loadHomePage);
route.get("/logout", logoutPage);

//User login page loading and user verification
route.get("/login", isLogin, loadLoginPage);
route.post("/login", verifyUser);

//load signup page and creating users
route.get("/signup", isLogin, loadSignUpPage);
route.post("/signup", createUser);

//loading OTP page for user verifiation
route.get("/send-otp", isLogin, loadSend_OTP_Page);

//forgot password email page loading and load OTP verifying page
route.get("/forgot-password-email-verification", isLogin, loadEmailPage);
route.get("/forgot-password-otp", loadVerify_OTP_Page);

//load forgot password page and change the password
route.get("/forgot-password", isPasswordChange, loadForgotPassPage);
route.post("/forgot-password", forgotPassword);

//sending otp for forgot password
route.post("/send-otp", sendOTP);

//loading OTP entering page and verifying OTP
route.get("/verify-otp", isPasswordChange, loadVerify_OTP_Page);
route.post("/verify-otp", verifyOTP);

//resend OTP for user verification and forgot password
route.get("/resend-otp", resendOTP);

route.get("/cars-collection", loadCarCollection);

module.exports = route;
