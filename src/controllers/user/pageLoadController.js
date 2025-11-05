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
    //fetching data
    console.log("params from filter ", req.query);
    const querySearch = req.query;
    let { FilterPrice, FilterBrands, FilterCategories, FilterTypes, search } =
      querySearch;

    //converting to array
    FilterPrice = FilterPrice ? FilterPrice.split(",") : [];
    FilterBrands = FilterBrands ? FilterBrands.split(",") : [];
    FilterCategories = FilterCategories ? FilterCategories.split(",") : [];
    FilterTypes = FilterTypes ? FilterTypes.split(",") : [];

    //finding filter is existing
    if (
      FilterPrice.length ||
      FilterBrands.length ||
      FilterCategories.length ||
      FilterTypes.length
    ) {
      //sort price
      let sortByPrice = { createdAt: -1 };
      if (FilterPrice.length) {
        if (FilterPrice[0] === "low-price") sortByPrice = { price: 1 };
        if (FilterPrice[0] === "high-price") sortByPrice = { price: -1 };

        //filter brand
        let filter = { isListed: true };
        if (FilterBrands.length && FilterBrands[0] !== "undefined") {
          const findBrand = await Brand.find({
            name: { $in: FilterBrands },
          }).lean();
          FilterBrands = findBrand.map((brand) => brand._id);
          filter.brand_id = { $in: FilterBrands };
        }

        //filter Category
        if (FilterCategories.length && FilterCategories[0] !== "undefined") {
          const findCategory = await Category.find({
            name: { $in: FilterCategories },
          }).lean();
          FilterCategories = findCategory.map((brand) => brand._id);
          filter.category_id = { $in: FilterCategories };
        }
        //filter types
        if (FilterTypes.length && FilterTypes[0] !== "undefined") {
          const findTypes = await Type.find({
            name: { $in: FilterTypes },
          }).lean();
          FilterTypes = findTypes.map((brand) => brand._id);
          filter.product_type_id = { $in: FilterTypes };
        }

        //search
        if (search && search !== "undefined" && search.trim() !== "") {
          const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
          filter.$or = [{ name: regex }];
        }

        const cars = await Car.find(filter)
          .sort(sortByPrice)
          .populate("brand_id", "name")
          .populate("category_id", "name")
          .populate("product_type_id", "name")
          .populate("variantIds", "image_url")
          .lean();
        console.log(cars);
        return res.status(OK).json({ success: true, result: cars });
      }
    }

    //featching all cars
    const cars = await Car.find({ isListed: true })
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "image_url")
      .lean();
    const brands = await Brand.find({ isListed: true })
      .sort({ name: 1 })
      .lean();
    const categories = await Category.find({
      isListed: true,
      product: "Car",
    })
      .sort({ name: 1 })
      .lean();
    const types = await Type.find({ isListed: true }).sort({ name: 1 });
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
    console.log("params from filter ", req.query);
    const querySearch = req.query;
    let { FilterPrice, FilterBrands, FilterCategories, FilterTypes, search } =
      querySearch;

    //converting to array
    FilterPrice = FilterPrice ? FilterPrice.split(",") : [];
    FilterBrands = FilterBrands ? FilterBrands.split(",") : [];
    FilterCategories = FilterCategories ? FilterCategories.split(",") : [];
    FilterTypes = FilterTypes ? FilterTypes.split(",") : [];

    //finding filter is existing
    if (
      FilterPrice.length ||
      FilterBrands.length ||
      FilterCategories.length ||
      FilterTypes.length
    ) {
      //sort price
      let sortByPrice = { createdAt: -1 };
      if (FilterPrice.length) {
        if (FilterPrice[0] === "low-price") sortByPrice = { price: 1 };
        if (FilterPrice[0] === "high-price") sortByPrice = { price: -1 };

        //filter brand
        let filter = { isListed: true };
        if (FilterBrands.length && FilterBrands[0] !== "undefined") {
          const findBrand = await Brand.find({
            name: { $in: FilterBrands },
          }).lean();
          FilterBrands = findBrand.map((brand) => brand._id);
          filter.brand_id = { $in: FilterBrands };
        }

        //filter Category
        if (FilterCategories.length && FilterCategories[0] !== "undefined") {
          const findCategory = await Category.find({
            name: { $in: FilterCategories },
          }).lean();
          FilterCategories = findCategory.map((brand) => brand._id);
          filter.category_id = { $in: FilterCategories };
        }
        //filter types
        if (FilterTypes.length && FilterTypes[0] !== "undefined") {
          const findTypes = await Type.find({
            name: { $in: FilterTypes },
          }).lean();
          FilterTypes = findTypes.map((brand) => brand._id);
          filter.product_type_id = { $in: FilterTypes };
        }

        //search
        if (search && search !== "undefined" && search.trim() !== "") {
          const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
          filter.$or = [{ name: regex }];
        }

        const accessories = await Accessory.find(filter)
          .sort(sortByPrice)
          .populate("brand_id", "name")
          .populate("category_id", "name")
          .populate("product_type_id", "name")
          .lean();

        return res.status(OK).json({ success: true, result: accessories });
      }
    }

    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .lean();
    // console.log(accessories);
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
  } catch (error) {
    console.log("Error from loadAllAccessories", error);
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
