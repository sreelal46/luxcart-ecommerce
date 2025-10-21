const { OK } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");

//loading admin loaging page
const adminLoadLoginPage = (req, res) => {
  res.status(OK).render("admin/auth/login");
};

//loading forgot password page
const loadEmailVerify = (req, res) => {
  res.status(OK).render("admin/auth/verify-email");
};

//loading OTP page
const loadOTPVerify = (req, res) => {
  console.log("OTP Verify Page Route Hit");
  res.status(OK).render("admin/auth/verify-otp");
};

//loading password changing page
const loadChangePassword = (req, res) => {
  res.status(OK).render("admin/auth/change-password");
};

//loading dashboard
const loadDashboard = (req, res) => {
  console.log("Admin data from load dashboard", req.session.admin);
  res.status(OK).render("admin/dashboard/dashboard");
};

//loading brands
const loadBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({}).sort({ createdAt: -1 }).lean();
    res.render("admin/brand/brandManagement", { brands });
  } catch (err) {
    console.error(err);
    res.render("admin/brandManagement", { brands: [] });
    next(err);
  }
};

const loadCategory = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .sort({
        createdAt: -1,
      })
      .lean();
    res.status(OK).render("admin/categoryManagement", { categories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const loadType = async (req, res, next) => {
  try {
    //fetch all data
    const types = await Type.find({}).sort({ createdAt: -1 }).lean();
    res.status(OK).render("admin/typeManagement", { types });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  adminLoadLoginPage,
  loadDashboard,
  loadEmailVerify,
  loadOTPVerify,
  loadChangePassword,
  loadBrands,
  loadCategory,
  loadType,
};
