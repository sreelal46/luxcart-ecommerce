const { OK, NOT_FOUND } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const User = require("../../models/user/UserModel");
const mongoose = require("mongoose");

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
    //fetch data
    let { search, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    const [brand, totalBrand] = await Promise.all([
      Brand.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Brand.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: brand,
        totalPages: Math.ceil(totalBrand / limit),
        currentPage: page,
      });
    }

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
    let { search, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    const [category, totalCategory] = await Promise.all([
      Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: category,
        totalPages: Math.ceil(totalCategory / limit),
        currentPage: page,
      });
    }

    const categories = await Category.find({})
      .sort({
        createdAt: -1,
      })
      .lean();
    // console.log(categories);
    res.status(OK).render("admin/categoryManagement", { categories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//load Type page
const loadType = async (req, res, next) => {
  try {
    let { search, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    const [typess, totalType] = await Promise.all([
      Type.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Type.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: typess,
        totalPages: Math.ceil(totalType / limit),
        currentPage: page,
      });
    }

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
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search?.trim() || "";

    const filter = {};
    if (search && search !== "undefined") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    // Car Products
    const carsFilter = await Car.find(filter)
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("variantIds", "price stock")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Accessories
    const accessoriesFilter = await Accessory.find(filter)
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const fullProductsFilter = [...carsFilter, ...accessoriesFilter];

    const totalCars = await Car.countDocuments(filter);
    const totalAccessories = await Accessory.countDocuments(filter);
    const total = totalCars + totalAccessories;
    const totalPages = Math.ceil(total / limit);

    if (
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes("application/json"))
    ) {
      return res.json({
        success: true,
        fullProducts: fullProductsFilter, // frontend expects this name
        totalPages,
        currentPage: page,
      });
    }

    const brands = await Brand.find({ isListed: true }).lean();
    const categories = await Category.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true });

    // Initial full data for first page load
    const cars = await Car.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "price stock")
      .lean();

    const accessories = await Accessory.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();

    const fullProducts = [...cars, ...accessories];

    res.render("admin/products/productManagement", {
      brands,
      categories,
      types,
      fullProducts,
    });
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
    const users = await User.aggregate([
      {
        $lookup: {
          from: "orders", // collection name (plural, lowercase)
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
        },
      },
      {
        $project: {
          orders: 0, // remove heavy data
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(OK).render("admin/users/usersManagement", { users });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const usersManagementDetail = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const user = await User.aggregate([
      {
        $match: { _id: userId },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
        },
      },
      {
        $project: {
          orders: 0, // remove heavy data
        },
      },
    ]);

    if (!user.length) {
      return res.status(NOT_FOUND).render("errors/404");
    }
    console.log("user details", user[0]);
    // aggregation returns array → take first item
    res.status(OK).render("admin/users/userDetails", { user: user[0] });
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
  usersManagementDetail,
};
