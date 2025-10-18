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
  console.log("from loadHomePage:", req.user);
  res.status(OK).render("user/landingPage");
};

const loadLoginPage = (req, res) => {
  const alert = req.session.forgotSuccess;
  console.log("console from load login page:", alert);
  res.status(OK).render("user/login", { alert });
};

const loadEmailPage = (req, res) => {
  res.status(OK).render("user/verify-email");
};

const loadForgotPassPage = (req, res) => {
  res.status(OK).render("user/change-password");
};

const loadSignUpPage = (req, res) => {
  res.status(OK).render("user/signUp");
};

const loadSend_OTP_Page = (req, res) => {
  res.status(OK).render("user/verify-email");
};

const loadVerify_OTP_Page = (req, res) => {
  //geting user data
  // const { userId, email, verifyType } = req.session;

  console.log("Debug from loadVerify_otp_page:", req.session.email);
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
