const Admin = require("../../models/admin/adminModel");
const { FORBIDDEN, UNAUTHORIZED } = require("../../constant/statusCode");

const checkSession = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.status(FORBIDDEN).redirect("/admin/login");
    }

    // if (req.session.success) {
    //   return res.status(FORBIDDEN).redirect("/admin/login");
    // }

    const adminId = req.session.admin._id;
    const admin = await Admin.findById(adminId).lean();
    if (!admin) {
      return req.session.destroy((err) => {
        if (err) {
          return console.error("Error destroying session:", err);
        }
        res.clearCookie("admin.sid");
        res.status(OK).redirect("/admin/login");
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.log("Error from admin checksession", error);
    next(error);
  }
};

const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("from is login admin", req.session.admin);
      return res.redirect("/admin/dashboard");
    }
    next();
  } catch (error) {
    console.log("Error from user islogin", error);
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
