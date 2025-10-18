const { OK } = require("../../constant/statusCode");

//loading admin loaging page
const adminLoadLoginPage = (req, res) => {
  const message = req.session.success;
  req.session.success = undefined;
  res.status(OK).render("admin/login", { message: message });
};

//loading forgot password page
const loadEmailVerify = (req, res) => {
  res.status(OK).render("admin/verify-email");
};

//loading OTP page
const loadOTPVerify = (req, res) => {
  res.status(OK).render("admin/verify-otp");
};

//loading password changing page
const loadChangePassword = (req, res) => {
  res.status(OK).render("admin/change-password");
};

//loading dashboard
const loadDashboard = (req, res) => {
  console.log("Admin data from load dashboard", req.session.admin);
  res.status(OK).render("admin/dashboard");
};

module.exports = {
  adminLoadLoginPage,
  loadDashboard,
  loadEmailVerify,
  loadOTPVerify,
  loadChangePassword,
};
