const {
  OK,
  CREATED,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  REDIRECT,
} = require("../../constant/statusCode");
const { filterAndSearchProductUser } = require("../helper/filter");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const Cart = require("../../models/user/CartModel");
const carVariantModel = require("../../models/admin/carVariantModel");

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
    console.error("Error from loading page", error);
    next(error);
  }
};

const loadHomePage = async (req, res, next) => {
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
    console.error("Error from loading page", error);
    next(error);
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
    let {
      FilterPrice,
      FilterBrands,
      FilterCategories,
      FilterTypes,
      search,
      page,
      limit,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    FilterPrice = FilterPrice ? FilterPrice.split(",") : [];
    FilterBrands = FilterBrands ? FilterBrands.split(",") : [];
    FilterCategories = FilterCategories ? FilterCategories.split(",") : [];
    FilterTypes = FilterTypes ? FilterTypes.split(",") : [];

    const filter = { isListed: true };

    // Build Filters
    if (FilterBrands.length && FilterBrands[0] !== "undefined") {
      const findBrand = await Brand.find({
        name: { $in: FilterBrands },
      }).lean();
      filter.brand_id = { $in: findBrand.map((b) => b._id) };
    }

    if (FilterCategories.length && FilterCategories[0] !== "undefined") {
      const findCategory = await Category.find({
        name: { $in: FilterCategories },
      }).lean();
      filter.category_id = { $in: findCategory.map((c) => c._id) };
    }

    if (FilterTypes.length && FilterTypes[0] !== "undefined") {
      const findTypes = await Type.find({ name: { $in: FilterTypes } }).lean();
      filter.product_type_id = { $in: findTypes.map((t) => t._id) };
    }

    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    let sortBy = { createdAt: -1 };
    if (FilterPrice.length) {
      if (FilterPrice[0] === "low-price") sortBy = { price: 1 };
      if (FilterPrice[0] === "high-price") sortBy = { price: -1 };
    }

    // Fetch Data with Pagination
    const [cars, totalCars] = await Promise.all([
      Car.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .populate("product_type_id", "name")
        .populate("variantIds", "image_url")
        .lean(),
      Car.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: cars,
        totalPages: Math.ceil(totalCars / limit),
        currentPage: page,
      });
    }

    // Initial Page Load
    const brands = await Brand.find({ isListed: true })
      .sort({ name: 1 })
      .lean();
    const categories = await Category.find({ isListed: true, product: "Car" })
      .sort({ name: 1 })
      .lean();
    const types = await Type.find({ isListed: true }).sort({ name: 1 }).lean();
    res.render("user/products/car/carCollection", {
      cars,
      brands,
      categories,
      types,
      totalPages: Math.ceil(totalCars / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error loading car collection:", error);
    next(error);
  }
};

const loadSingleCarProduct = async (req, res, next) => {
  try {
    // Get data
    const userId = req.session.user._id;
    const carId = req.params.carId;
    let selectedVariantId = req.query.variantId;
    const cart = await Cart.findOne({ userId });

    // Load Car + variants
    const singleCar = await Car.findById(carId)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "image_url stock color price")
      .lean();
    // Active variant
    if (!selectedVariantId) {
      selectedVariantId = singleCar.variantIds[0]._id.toString();
    }

    // Load active variant
    const variant = await carVariantModel.findById(selectedVariantId).lean();

    // CART CHECKING (correct and dynamic)
    let inCart = false;
    let inCartVariants = [];

    if (cart) {
      // get all variantIds in cart
      inCartVariants = cart.items
        .filter((item) => item.variantId != null) // accessory items removed
        .map((item) => String(item.variantId)); // safe string conversion

      // check if SELECTED variant in cart
      const isIn = inCartVariants.includes(selectedVariantId);
      inCart = !!isIn;
    }

    // Related cars
    const relatedCars = await Car.find({
      brand_id: singleCar.brand_id._id,
      _id: { $ne: singleCar._id },
    })
      .limit(4)
      .populate("brand_id product_type_id variantIds")
      .lean();

    // If frontend requested JSON
    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        singleCar,
        relatedCars,
        inCart,
        inCartVariants,
        variant,
      });
    }

    // Normal page load
    res.render("user/products/car/viewCarProduct", {
      singleCar,
      relatedCars,
      selectedVariantId,
      inCart,
      inCartVariants,
    });
  } catch (error) {
    console.log("Error from Loading single Car Product", error);
    next(error);
  }
};

const loadAllAccessories = async (req, res, next) => {
  try {
    let {
      FilterPrice,
      FilterBrands,
      FilterCategories,
      FilterTypes,
      search,
      page,
      limit,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    FilterPrice = FilterPrice ? FilterPrice.split(",") : [];
    FilterBrands = FilterBrands ? FilterBrands.split(",") : [];
    FilterCategories = FilterCategories ? FilterCategories.split(",") : [];
    FilterTypes = FilterTypes ? FilterTypes.split(",") : [];

    const filter = { isListed: true };

    // Build Filters
    if (FilterBrands.length && FilterBrands[0] !== "undefined") {
      const findBrand = await Brand.find({
        name: { $in: FilterBrands },
      }).lean();
      filter.brand_id = { $in: findBrand.map((b) => b._id) };
    }

    if (FilterCategories.length && FilterCategories[0] !== "undefined") {
      const findCategory = await Category.find({
        name: { $in: FilterCategories },
      }).lean();
      filter.category_id = { $in: findCategory.map((c) => c._id) };
    }

    if (FilterTypes.length && FilterTypes[0] !== "undefined") {
      const findTypes = await Type.find({ name: { $in: FilterTypes } }).lean();
      filter.product_type_id = { $in: findTypes.map((t) => t._id) };
    }

    if (search && search !== "undefined" && search.trim() !== "") {
      const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
      filter.$or = [{ name: regex }];
    }

    let sortBy = { createdAt: -1 };
    if (FilterPrice.length) {
      if (FilterPrice[0] === "low-price") sortBy = { price: 1 };
      if (FilterPrice[0] === "high-price") sortBy = { price: -1 };
    }

    // Fetch Data with Pagination
    const [accessory, totalAccessory] = await Promise.all([
      Accessory.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .populate("product_type_id", "name")
        .lean(),
      Accessory.countDocuments(filter),
    ]);

    if (req.xhr || req.headers.accept.indexOf("application/json") > -1) {
      return res.json({
        success: true,
        result: accessory,
        totalPages: Math.ceil(totalAccessory / limit),
        currentPage: page,
      });
    }
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .lean();

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
    const userId = req.session.user._id;
    const productId = req.params.id;
    const cart = await Cart.findOne({ userId });

    const accessory = await Accessory.findById(productId)
      .populate("brand_id category_id product_type_id")
      .lean();

    // CART CHECKING
    let inCart = false;

    if (cart && cart.items.length > 0) {
      const accessoryItems = cart.items.filter(
        (item) => item.accessoryId != null
      );

      const inCartAccessoryIds = accessoryItems.map((item) =>
        String(item.accessoryId)
      );

      inCart = inCartAccessoryIds.includes(String(productId));
    }
    console.log(accessory);
    res.status(OK).render("user/products/accessory/viewAccessorProduct", {
      accessory,
      inCart,
    });
  } catch (error) {
    console.log("Error from loadSingleAccessories", error);
    next(error);
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
  loadSingleCarProduct,
  loadAllAccessories,
  loadSingleAccessories,
};
