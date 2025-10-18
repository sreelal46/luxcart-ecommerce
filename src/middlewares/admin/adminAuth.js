const Admin = require("../../models/admin/adminModel");
const { FORBIDDEN, UNAUTHORIZED } = require("../../constant/statusCode");

const checkSession = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.status(FORBIDDEN).redirect("/admin/login");
    }

    if (req.session.success) {
      console.log(req.session.success);
      return res.status(FORBIDDEN).redirect("/admin/login");
    }

    console.log("from checkSession", req.session.admin);
    const adminId = req.session.admin._id;
    const admin = await Admin.findById(adminId).lean();
    if (!admin) return res.status(UNAUTHORIZED).redirect("/admin/login");
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("from is login admin", req.session.admin);
      // If logged in, redirect to dashboard
      return res.redirect("/admin/dashboard");
    }
    next();
  } catch (error) {
    next(error);
  }
};

const isPasswordChange = (req, res, next) => {
  if (req.session.passwordChanged) {
    return res.status(FORBIDDEN).redirect("/admin/login");
  }
  next();
};

module.exports = { checkSession, isLogin, isPasswordChange };
