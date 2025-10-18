const express = require("express");
const route = express.Router();

const {
  checkSession,
  isLogin,
  isPasswordChange,
} = require("../middlewares/admin/adminAuth");
const {
  adminLoadLoginPage,
  loadDashboard,
  loadChangePassword,
  loadEmailVerify,
  loadOTPVerify,
} = require("../controllers/admin/pageLoad.controller");
const {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
} = require("../controllers/admin/adminAuth.controller");

// Setup for admin layout for these routes only
route.use((req, res, next) => {
  res.locals.layout = "adminLayout";
  next();
});

// loading login page
route.get("/login", isLogin, adminLoadLoginPage);

// login POST
route.post("/login", verifyadmin);

//logout
route.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

//forgot-password setup
route.get("/verify-email-page", loadEmailVerify);
route.post("/verify-email", emailVerification);
route.get("/otp-verify-page", isPasswordChange, loadOTPVerify);
route.post("/otp-verify", OTPVerification);
route.get("/change-password-page", isPasswordChange, loadChangePassword);
route.post("/change-password", PasswordChanging);

//resend OTP
route.get("/resend-otp", resendOTP);

// Dashboard
route.get("/dashboard", checkSession, loadDashboard);

module.exports = route;
