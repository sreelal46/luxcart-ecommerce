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
const loadContactPage = async (req, res, next) => {
  try {
    // Find the first admin (assuming single admin system)
    const admin = await Admin.findOne();

    if (!admin || !admin.bannerMedia || admin.bannerMedia.length === 0) {
      return null;
    }
    res.status(OK).render("user/company/contactUs", {});
  } catch (error) {
    console.error("Error from loadContactPage", error);
    next(error);
  }
};
const loadAboutUsPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/company/aboutUs", {});
  } catch (error) {
    console.error("Error from loadAboutUsPage", error);
    next(error);
  }
};
const loadFAQPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/company/faq");
  } catch (error) {
    console.error("Error from loadFAQPage", error);
    next(error);
  }
};
const loadWarrantyPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/company/warranty", {});
  } catch (error) {
    console.error("Error from loadWarrantyPage", error);
    next(error);
  }
};
const loadShippingPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/company/shipping", {});
  } catch (error) {
    console.error("Error from loadShippingPage", error);
    next(error);
  }
};
const loadPrivacyPolicyPage = async (req, res, next) => {
  try {
    res.status(OK).render("user/company/privacyPolicy", {});
  } catch (error) {
    console.error("Error from loadPrivacyPolicyPage", error);
    next(error);
  }
};

module.exports = {
  loadLandingPage,
  loadHomePage,
  loadContactPage,
  loadAboutUsPage,
  loadPrivacyPolicyPage,
  loadShippingPage,
  loadWarrantyPage,
  loadFAQPage,
};
