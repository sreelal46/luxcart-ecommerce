const { OK } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const CarVariant = require("../../models/admin/carVariantModel");

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

//Loading category
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

//load Type page
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

//Load Product page
const loadProduct = async (req, res, next) => {
  try {
    let cars = await Car.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price stock")
      .lean();

    res.status(OK).render("admin/products/productManagement", { cars });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//load single car product
const loadEditCar = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const carId = req.params.id;
    const singleCar = await Car.findById(carId)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price color stock image_url")
      .lean();
    console.log(singleCar);

    res.status(OK).render("admin/products/car/view-car-product", { singleCar });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//load add car product
const loadCarProduct = async (req, res, next) => {
  try {
    const brands = await Brand.find({}).lean();
    const category = await Category.find({ product: "Car" }).lean({
      getters: true,
    });
    const types = await Type.find({}).lean();
    res.status(OK).render("admin/products/car/add-car-product", {
      brands,
      category,
      types,
    });
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
  loadProduct,
  loadCarProduct,
  loadEditCar,
};
