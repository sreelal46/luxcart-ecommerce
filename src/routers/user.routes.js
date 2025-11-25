const express = require("express");
const route = express.Router();
const upload = require("../config/multer");

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
  loadSingleCarProduct,
  loadAllAccessories,
  loadSingleAccessories,
} = require("../controllers/user/pageLoadController");

const {
  loadAccountPage,
  loadProfilePage,
  loadEditProfilePage,
  loadAddressPage,
  loadAddAddressPage,
} = require("../controllers/user/pageLoadTwo.controller");
const {
  editProfile,
  addAddress,
} = require("../controllers/user/account.controller");

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
route.get("/send-otp", isLogin, isPasswordChange, loadSend_OTP_Page);
//sending otp for forgot password
route.post("/send-otp", sendOTP);

//forgot password email page loading and load OTP verifying page
route.get("/forgot-password-email-verification", isLogin, loadEmailPage);
route.get("/forgot-password-otp", loadVerify_OTP_Page);

//load forgot password page and change the password
route.get("/forgot-password", isPasswordChange, loadForgotPassPage);
route.post("/forgot-password", forgotPassword);

//loading OTP entering page and verifying OTP
route.get("/verify-otp", isPasswordChange, loadVerify_OTP_Page);
route.post("/verify-otp", verifyOTP);

//resend OTP for user verification and forgot password
route.get("/resend-otp", resendOTP);

//car colletions
route.get("/cars-collection", checkSession, loadCarCollection);
route.get(
  "/cars-collection/view-car-product/:id",
  checkSession,
  loadSingleCarProduct
);

//view all accessories
route.get("/all-accessories", checkSession, loadAllAccessories);
route.get(
  "/all-accessories/view-accessory-product/:id",
  checkSession,
  loadSingleAccessories
);

//view account details
route.get("/account", checkSession, loadAccountPage);
route.get("/account/profile", checkSession, loadProfilePage);
route.get(
  "/account/profile/edit-profile/:userId",
  checkSession,
  loadEditProfilePage
);
route.post(
  "/account/profile/edit-profile/:userId",
  checkSession,
  upload.any(),
  editProfile
);
route.get("/account/addresses", checkSession, loadAddressPage);
route.get("/account/addresses/add-address", checkSession, loadAddAddressPage);
route.post("/account/addresses/add-address/:userId", checkSession, addAddress);

route.get("/account/orders", (req, res) => {
  res.render("user/account/orderHistory", { layout: "userAccountLayout" });
});

module.exports = route;
