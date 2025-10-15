const {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");

//loading login page
const loadLandingPage = (req, res) => {
  res.status(OK).render("user/landingPage");
};

const loadHomePage = (req, res) => {
  console.log(req.user);
  res.status(OK).render("user/landingPage", { user: req.user });
};

const loadLoginPage = (req, res) => {
  res.status(OK).render("user/login");
};

const loadEmailPage = (req, res) => {
  res.status(OK).render("user/verify-email");
};

const loadForgotPassPage = (req, res) => {
  res.status(OK).render("user/forgot-password");
};

const loadSignUpPage = (req, res) => {
  res.status(OK).render("user/signUp");
};

const loadSend_OTP_Page = (req, res) => {
  res.status(OK).render("user/verify-email");
};

const loadVerify_OTP_Page = (req, res) => {
  res.status(OK).render("user/verify-otp");
};

module.exports = {
  loadLandingPage,
  loadHomePage,
  loadLoginPage,
  loadEmailPage,
  loadSignUpPage,
  loadSend_OTP_Page,
  loadVerify_OTP_Page,
  loadForgotPassPage,
};
