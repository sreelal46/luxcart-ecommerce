const {
  OK,
  CONFLICT,
  NOT_FOUND,
  BAD_REQUEST,
} = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Car = require("../../models/admin/productCarModal");
const Category = require("../../models/admin/categoryModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const mongoose = require("mongoose");

const addCategory = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const productType = req.body.productType?.trim();

    if (!name || !description || !productType) {
      return res
        .status(400)
        .json({ success: false, alert: "All fields are required." });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      product: productType,
    }).lean();

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        alert: "This category already exists for this product type.",
      });
    }

    const newCategory = new Category({
      name,
      product: productType,
      description,
    });

    await newCategory.save();

    return res
      .status(200)
      .json({ success: true, alert: "Category added successfully" });
  } catch (error) {
    console.error("Error while adding category:", error);
    next(error);
  }
};

const editCategory = async (req, res, next) => {
  try {
    const categorieId = req.params.id;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const product = req.body.product?.trim();
    console.log(req.body);

    if (!name || !description || !product) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "All fields are required" });
    }

    const categoryData = await Category.findById(categorieId).lean();
    if (!categoryData) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Category not found" });
    }

    // Check duplicates only if name OR product changed
    if (
      categoryData.name.toLowerCase() !== name.toLowerCase() ||
      categoryData.product !== product
    ) {
      const duplicate = await Category.findOne({
        _id: { $ne: categorieId },
        name: { $regex: new RegExp(`^${name}$`, "i") },
        product,
      });

      if (duplicate) {
        return res.status(CONFLICT).json({
          success: false,
          alert: "Category already exists for this product type.",
        });
      }
    }

    // Update category
    await Category.findByIdAndUpdate(categorieId, {
      name,
      description,
      product,
    });

    return res
      .status(OK)
      .json({ success: true, alert: "Category updated successfully!" });
  } catch (error) {
    console.error("Error updating category:", error);
    next(error);
  }
};

const softDeleteCategory = async (req, res, next) => {
  try {
    //collecting ID
    const id = req.params.id;

    //searching and unlisting or listing product
    const category = await Category.findById(id);
    if (!category)
      return res
        .status(NOT_FOUND)
        .json({ success: true, alet: "Somthing Wrong" });
    if (category.isListed) {
      await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    } else {
      await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    }

    res.status(OK).json({ success: true, alert: "Unlisted " });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addOfferToCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { discountType, discountValue, validFrom, validTo } = req.body;

    /* ========== VALIDATION ========== */
    if (!["Percentage", "Price"].includes(discountType)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid discount type" });
    }

    if (
      discountType === "Percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Percentage must be between 1–100" });
    }

    if (discountType === "Price" && discountValue <= 0) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Price discount must be > 0" });
    }

    if (new Date(validFrom) >= new Date(validTo)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid date range" });
    }

    const now = new Date();
    const isActive = new Date(validFrom) <= now && new Date(validTo) > now;

    /* ========== UPDATE CATEGORY - CRON WILL HANDLE PRODUCT UPDATES ========== */
    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        $set: {
          offer: {
            discountType,
            discountValue,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            isActive,
            isConfigured: true,
          },
        },
      },
      { new: true }
    );

    if (!category) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Category not found" });
    }

    res.status(OK).json({
      success: true,
      alert: isActive
        ? "Category offer applied. All products will update shortly."
        : `Category offer scheduled. Will activate automatically on ${new Date(
            validFrom
          ).toLocaleDateString()}.`,
    });
  } catch (err) {
    next(err);
  }
};

const removeOfferToCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    /* ========== REMOVE CATEGORY OFFER - CRON WILL HANDLE CLEANUP ========== */
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $unset: { offer: "" } },
      { new: true }
    );

    if (!category) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Category not found" });
    }

    res.status(OK).json({
      success: true,
      alert: "Category offer removed. All product prices will reset shortly.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addCategory,
  editCategory,
  softDeleteCategory,
  addOfferToCategory,
  removeOfferToCategory,
};
