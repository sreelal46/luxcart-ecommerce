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
const Admin = require("../../models/admin/adminModel");

//loading login page
const loadLandingPage = async (req, res, next) => {
  try {
    // Find the first admin (assuming single admin system)
    const admin = await Admin.findOne();

    if (!admin || !admin.bannerMedia || admin.bannerMedia.length === 0) {
      return null;
    }

    // Find the banner and address
    const defaultBanner = admin.bannerMedia.find(
      (banner) => banner.isDefault === true,
    );
    res.locals.footer = {
      address: admin.address,
      email: admin.email,
      phone: admin.phone,
    };
    req.session.save();
    const brands = await Brand.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true }).lean();
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .populate("product_type_id")
      .limit(4)
      .lean();
    res.status(OK).render("user/landingPage", {
      brands,
      types,
      accessories,
      defaultBanner: defaultBanner || admin.bannerMedia[0],
    });
  } catch (error) {
    console.error("Error from loading page", error);
    next(error);
  }
};

const loadHomePage = async (req, res, next) => {
  try {
    // Find the first admin (assuming single admin system)
    const admin = await Admin.findOne();

    if (!admin || !admin.bannerMedia || admin.bannerMedia.length === 0) {
      return null;
    }

    // Find the banner and address
    const defaultBanner = admin.bannerMedia.find(
      (banner) => banner.isDefault === true,
    );
    res.locals.footer = {
      address: admin.address,
      email: admin.email,
      phone: admin.phone,
    };
    req.session.save();
    const brands = await Brand.find({ isListed: true }).lean();
    const types = await Type.find({ isListed: true }).lean();
    const accessories = await Accessory.find({ isListed: true })
      .sort({ createdAt: -1 })
      .populate("product_type_id")
      .limit(4)
      .lean();
    res.status(OK).render("user/landingPage", {
      brands,
      types,
      accessories,
      defaultBanner: defaultBanner || admin.bannerMedia[0],
    });
  } catch (error) {
    console.error("Error from loading page", error);
    next(error);
  }
};

module.exports = {
  loadLandingPage,
  loadHomePage,
};
