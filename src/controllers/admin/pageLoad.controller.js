const { OK } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const User = require("../../models/user/UserModel");
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
    //car Product
    const cars = await Car.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price stock")
      .lean();

    //Accessories
    const accessories = await Accessory.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();

    res
      .status(OK)
      .render("admin/products/productManagement", { cars, accessories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//load single car product
const loadViewCar = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const carId = req.params.id;
    const singleCar = await Car.findById(carId)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price color stock image_url")
      .lean();
    // console.log(singleCar);

    res.status(OK).render("admin/products/car/view-car-product", { singleCar });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//edit car page
const loadEditCar = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const singleCar = await Car.findById(carId)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price color stock image_url")
      .lean();
    const brands = await Brand.find({ isListed: true });
    const categories = await Category.find({ isListed: true, product: "Car" });
    const types = await Type.find({ isListed: true });
    // console.log(singleCar);

    res.status(OK).render("admin/products/car/edit-car-product", {
      singleCar,
      brands,
      categories,
      types,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//load add car product
const loadCarProduct = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isListed: true }).lean();
    const category = await Category.find({
      isListed: true,
      product: "Car",
    }).lean({
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

//load add accessories
const loadAddAccessories = async (req, res) => {
  try {
    const brands = await Brand.find({ isListed: true }).lean();
    const category = await Category.find({
      isListed: true,
      product: "Accessories",
    }).lean();
    const types = await Type.find({ isListed: true }).lean();
    res
      .status(OK)
      .render("admin/products/accessories/add-accessories-product", {
        brands,
        category,
        types,
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//view accessories
const loadViewAccessories = async (req, res, next) => {
  try {
    const id = req.params.id;

    const accessory = await Accessory.findById(id)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();

    res.render("admin/products/accessories/view-accessories-product", {
      accessory,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//edit accessories
const loadEditAccessories = async (req, res, next) => {
  try {
    const id = req.params.id;

    const types = await Type.find({ isListed: true }).lean();
    const categories = await Category.find({
      isListed: true,
      product: "Accessories",
    }).lean();
    const brands = await Brand.find({ isListed: true }).lean();
    const accessory = await Accessory.findById(id)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();

    res
      .status(OK)
      .render("admin/products/accessories/edit-accessories-product", {
        accessory,
        types,
        categories,
        brands,
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//User Management
const usersManagement = async (req, res, next) => {
  try {
    //finding all users
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    // console.log(users);
    res.status(OK).render("admin/users/usersManagement", { users });
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
  loadViewCar,
  loadEditCar,
  loadAddAccessories,
  loadViewAccessories,
  loadEditAccessories,
  usersManagement,
};
