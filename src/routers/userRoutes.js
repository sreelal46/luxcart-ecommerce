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
} = require("../controllers/user/pageLoadController");
const {
  createUser,
  verifyUser,
  sendOTP,
  verifyOTP,
  forgotPassword,
} = require("../controllers/user/usersController");
const { isLogin } = require("../middlewares/user/userAuth");

route.get("/", loadLandingPage);
route.get("/homepage", isLogin, loadHomePage);

//User login page loading and user verification
route.get("/login", isLogin, loadLoginPage);
route.post("/login", verifyUser);

route.get("/forgot-password-email-verification", isLogin, loadEmailPage);
route.post("/forgot-password-otp", loadVerify_OTP_Page);

//load signup page
route.get("/signup", isLogin, loadSignUpPage);
route.post("/signup", createUser);

route.get("/send-otp", isLogin, loadSend_OTP_Page);
route.post("/send-otp", sendOTP);

route.get("/verify-otp", isLogin, loadVerify_OTP_Page);
route.post("/verify-otp", verifyOTP);

route.get("/forgot-password", isLogin, loadForgotPassPage);
route.post("/forgot-password", forgotPassword);

module.exports = route;
