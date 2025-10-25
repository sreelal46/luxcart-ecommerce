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
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");

//loading login page
const loadLandingPage = (req, res) => {
  res.status(OK).render("user/landingPage");
};

const loadHomePage = (req, res) => {
  console.log("from loadHomePage:", req.user);
  res.status(OK).render("user/landingPage");
};

const loadLoginPage = (req, res) => {
  console.log("2555555555552222222222222222222", req.session.user);
  res.status(OK).render("user/auth/login");
};

const loadEmailPage = (req, res) => {
  res.status(OK).render("user/auth/verify-email");
};

const loadForgotPassPage = (req, res) => {
  res.status(OK).render("user/auth/change-password");
};

const loadSignUpPage = (req, res) => {
  res.status(OK).render("user/auth/signUp");
};

const loadSend_OTP_Page = (req, res) => {
  res.status(OK).render("user/auth/verify-email");
};

const loadVerify_OTP_Page = (req, res) => {
  //geting user data
  // const { userId, email, verifyType } = req.session;

  console.log("Debug from loadVerify_otp_page:", req.session.email);
  res.status(OK).render("user/auth/verify-otp");
};

const loadCarCollection = async (req, res, next) => {
  try {
    const cars = await Car.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "image_url")
      .lean();
    const brands = await Brand.find({ isListed: true }).lean();
    const categories = await Category.find({
      isListed: true,
      product: "Car",
    }).lean();
    const types = await Type.find({ isListed: true });
    res.status(200).render("user/products/car/carCollection", {
      cars,
      brands,
      categories,
      types,
    });
  } catch (error) {
    console.error("Error loading car collection:", error);
    res.status(500).send("Something went wrong");
  }
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
  loadCarCollection,
};
