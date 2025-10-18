const bcrypt = require("bcrypt");
const Admin = require("../../models/admin/adminModel");
const OTP = require("../../models/common/OTPModal");
const {
  FORBIDDEN,
  OK,
  UNAUTHORIZED,
  CONFLICT,
  GONE,
} = require("../../constant/statusCode");
const emailSending = require("../../services/sendEmail");

// Verify admin login
const verifyadmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res
        .status(FORBIDDEN)
        .render("admin/login", { alert: "Email not found" });

    const compare = await bcrypt.compare(password, admin.password);
    if (!compare)
      return res
        .status(FORBIDDEN)
        .render("admin/login", { alert: "Invalid email or password" });

    // Store session object
    req.session.admin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
    };
    req.session.save(() => res.status(OK).redirect("/admin/dashboard"));
  } catch (error) {
    next(error);
  }
};

//email verification
const emailVerification = async (req, res, next) => {
  try {
    //saving data to variale
    const email = req.body;
    //finding admin
    const admin = await Admin.findOne(email);
    console.log("from email verification in admin side", admin);

    //if not found admin
    if (!admin)
      return res
        .status(UNAUTHORIZED)
        .render("admin/verify-email", { alert: "Email not Found" });

    //saving admin id to session for OTP verification
    const adminId = admin._id;
    req.session.adminId = adminId;

    const typeOfMail = "ForgotPassword";
    //sending OTP to email
    await emailSending(admin.email, adminId, typeOfMail);

    res.status(OK).redirect("/admin/otp-verify-page");
  } catch (error) {
    console.log("error from email verification in admin side:", error);
    next(error);
  }
};

//resen otp
const resendOTP = async (req, res, next) => {
  try {
    //debug
    console.log("from resend otp admin", req.session.adminId);

    //find admin
    const admin = await Admin.findById(req.session.adminId);
    console.log("from resend otp", admin);

    //sending email
    await emailSending(admin.email, admin._id, "ForgotPassword");

    res.status(OK).redirect("/admin/otp-verify-page");
  } catch (error) {
    console.log("error from resend OTP", error);
    next(error);
  }
};

//OTP verification
const OTPVerification = async (req, res, next) => {
  try {
    //debug
    console.log("Admin OTP verification", req.body);
    console.log("Admin OTP verification", req.session.adminId);

    //OTP saving
    const OTPCode = Object.values(req.body).join("");
    console.log("Admin enterd otp:", OTPCode);

    //finding OTP
    const adminOTP = await OTP.findOne({
      userId: req.session.adminId,
    }).sort({
      createdAt: -1,
    });

    //if OTP not found
    if (!adminOTP)
      return res
        .status(GONE)
        .render("admin/verify-otp", { alert: "Your OTP has expired" });

    //comparing OTP
    const compare = await bcrypt.compare(OTPCode, adminOTP.otp);
    console.log("comparing OTP form admin", compare);

    //if compare not true
    if (!compare)
      return res
        .status(CONFLICT)
        .render("admin/verify-otp", { alert: "Invalid OTP.Please try again." });

    res.status(OK).redirect("/admin/change-password-page");
  } catch (error) {
    console.log("Error form admin OTP verificcation", error);
    next(error);
  }
};

//password changing
const PasswordChanging = async (req, res, next) => {
  try {
    //debug
    console.log("Password", req.body);
    console.log("admin Id", req.session.adminId);

    //data geting
    const { newPassword, confirmPassword } = req.body;

    //compare password
    if (newPassword !== confirmPassword)
      return res.status(CONFLICT).render("admin/change-password");

    //password hashing
    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);
    console.log("Hashed new password in admin", hashNewPassword);

    //finding admin
    const admin = await Admin.findById(req.session.adminId);
    console.log("Admin data founded at password changing", admin);

    //updating admin password
    await Admin.updateOne(
      { _id: admin._id },
      { $set: { password: hashNewPassword } }
    );

    //saving success message
    req.session.passwordChanged = true;
    req.session.success = "Password changed successfully";
    console.log("session checking in chnage password", req.session.success);

    req.session.save(() => res.status(OK).redirect("/admin/login"));
  } catch (error) {
    console.error("Error from password chnaging admin", error);
    next(error);
  }
};

module.exports = {
  verifyadmin,
  emailVerification,
  OTPVerification,
  PasswordChanging,
  resendOTP,
};
