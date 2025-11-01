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
const Accessory = require("../../models/admin/productAccessoryModal");

//loading login page
const loadLandingPage = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true }).lean();
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .populate("product_type_id")
      .limit(4)
      .lean();
    res.status(OK).render("user/landingPage", { brands, types, accessories });
  } catch (error) {
    console.error("Error from loading page");
  }
};

const loadHomePage = async (req, res) => {
  try {
    const brands = await Brand.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true }).lean();
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .populate("product_type_id", "name")
      .limit(4)
      .lean();

    res.status(OK).render("user/landingPage", { brands, types, accessories });
  } catch (error) {
    console.error("Error from loading page");
  }
};

const loadLoginPage = (req, res) => {
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
  res.status(OK).render("user/auth/verify-otp");
};

const loadCarCollection = async (req, res, next) => {
  try {
    const cars = await Car.find({ isListed: true })
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
    next(error);
  }
};

const loadSingleCarProduct = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const carId = req.params.id;
    const singleCar = await Car.findById(carId)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "image_url stock color price")
      .lean();
    console.log(singleCar);
    const relatedCars = await Car.find({
      brand_id: singleCar.brand_id._id,
      _id: { $ne: singleCar._id },
    })
      .limit(4)
      .populate("brand_id product_type_id variantIds")
      .lean();

    res
      .status(OK)
      .render("user/products/car/viewCarProduct", { singleCar, relatedCars });
  } catch (error) {
    console.log("Error from Loading single Car Product", error);
    next(error);
  }
};

const loadAllAccessories = async (req, res, next) => {
  try {
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .lean();
    console.log(accessories);
    const brands = await Brand.find({ isListed: true }).lean();
    const categories = await Category.find({
      isListed: true,
      product: "Accessories",
    }).lean();
    const types = await Type.find({ isListed: true });
    res.status(OK).render("user/products/accessory/accessoryCollection", {
      accessories,
      brands,
      categories,
      types,
    });
  } catch (error) {
    console.log("Error from loadAllAccessories", error);
    next(error);
  }
};

const loadSingleAccessories = async (req, res, next) => {
  try {
    const accessory = await Accessory.findById(req.params.id)
      .populate("brand_id category_id product_type_id")
      .lean();
    console.log(accessory);
    res
      .status(OK)
      .render("user/products/accessory/viewAccessorProduct", { accessory });
  } catch (error) {}
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
  loadSingleCarProduct,
  loadAllAccessories,
  loadSingleAccessories,
};
