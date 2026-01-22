const { OK, NOT_FOUND } = require("../../constant/statusCode");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const User = require("../../models/user/UserModel");
const Wallet = require("../../models/user/walletsModel");
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

const loadProduct = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search?.trim() || "";
    const productType = req.query.productType; // "car", "accessory", or undefined/All

    // Build filter object
    const filter = {};

    // Search filter - improved regex
    if (search && search !== "undefined" && search !== "") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [{ name: searchRegex }];
    }

    // Brand filter
    if (req.query.brand && req.query.brand !== "All") {
      filter.brand_id = req.query.brand;
    }

    // Category filter
    if (req.query.category && req.query.category !== "All") {
      filter.category_id = req.query.category;
    }

    // Type filter
    if (req.query.type && req.query.type !== "All") {
      filter.product_type_id = req.query.type;
    }

    // Price range filter
    const priceFilter = {};
    if (req.query.minPrice) {
      priceFilter.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      priceFilter.$lte = parseFloat(req.query.maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    // Stock status filter (only for accessories)
    if (req.query.stockStatus && req.query.stockStatus !== "All") {
      if (req.query.stockStatus === "In Stock") {
        filter.stock = { $gt: 0 };
      } else if (req.query.stockStatus === "Out of Stock") {
        filter.stock = { $lte: 0 };
      }
    }

    let carsFilter = [];
    let accessoriesFilter = [];
    let totalCars = 0;
    let totalAccessories = 0;

    // Fetch based on product type filter
    if (!productType || productType === "All" || productType === "car") {
      totalCars = await Car.countDocuments(filter);

      // Car Products with filter
      carsFilter = await Car.find(filter)
        .sort({ createdAt: -1 })
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .populate(
          "variantIds",
          "price stock offerPrices appliedOffer productOffer",
        )
        .lean();
    }

    if (!productType || productType === "All" || productType === "accessory") {
      totalAccessories = await Accessory.countDocuments(filter);

      // Accessories with filter
      accessoriesFilter = await Accessory.find(filter)
        .sort({ createdAt: -1 })
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .lean();
    }

    // Combine and sort by createdAt
    let fullProductsFilter = [...carsFilter, ...accessoriesFilter];
    fullProductsFilter.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    // Offer-only filter (applied after fetching due to nested structure)
    if (req.query.offerOnly === "true") {
      fullProductsFilter = fullProductsFilter.filter((product) => {
        if (product.engine) {
          // For cars, check variant offer
          return product.variantIds?.[0]?.productOffer?.isActive;
        } else {
          // For accessories, check product offer
          return product.productOffer?.isActive;
        }
      });
    }

    // IMPORTANT: Apply pagination AFTER combining and filtering
    const total = fullProductsFilter.length;
    const totalPages = Math.ceil(total / limit);

    // Slice the array for current page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = fullProductsFilter.slice(startIndex, endIndex);

    // Check if it's an AJAX request
    if (
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      (req.headers.accept && req.headers.accept.includes("application/json"))
    ) {
      return res.json({
        success: true,
        fullProducts: paginatedProducts,
        totalPages,
        currentPage: page,
      });
    }

    // Initial page load - fetch brands, categories, types
    const brands = await Brand.find({ isListed: true }).lean();
    const categories = await Category.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true }).lean();

    // Use the paginated data for initial render
    res.render("admin/products/productManagement", {
      brands,
      categories,
      types,
      fullProducts: paginatedProducts,
      totalPages,
      currentPage: page,
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

module.exports = {
  adminLoadLoginPage,
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
};
