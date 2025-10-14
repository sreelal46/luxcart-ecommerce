const express = require("express");
const route = express.Router();
const {
  loadLandingPage,
  loadLoginPage,
  loadSignUpPage,
  loadSend_OTP_Page,
  loadVerify_OTP_Page,
  loadEmailPage,
  loadForgotPassPage,
} = require("../controllers/user/pageLoadController");
const {
  createUser,
  sendOTP,
  verifyOTP,
  forgotPassword,
} = require("../controllers/user/usersController");

route.get("/", loadLandingPage);

//User login page loading and user verification
route.get("/login", loadLoginPage);

route.get("/forgot-password", loadEmailPage);
route.post("/forgot-password-otp", loadVerify_OTP_Page);

//load signup page
route.get("/signup", loadSignUpPage);
route.post("/signup", createUser);

route.get("/send-otp", loadSend_OTP_Page);
route.post("/send-otp", sendOTP);

route.get("/verify-otp", loadVerify_OTP_Page);
route.post("/verify-otp", verifyOTP);

route.get("/forgot-password", loadForgotPassPage);
route.post("/forgot-password", forgotPassword);

module.exports = route;
