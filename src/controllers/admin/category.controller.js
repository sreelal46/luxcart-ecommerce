const {
  OK,
  CONFLICT,
  NOT_FOUND,
  BAD_REQUEST,
} = require("../../constant/statusCode");
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
    // VALIDATION
    if (
      discountType === "Percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Percentage discount must be between 1 and 100",
      });
    }
    // UPDATE CATEGORY OFFER
    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        $set: {
          offer: {
            discountType,
            discountValue,
            validFrom,
            validTo,
            isActive: true,
          },
        },
      },
      { new: true }
    );

    if (!category) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Category not found",
      });
    }
    // APPLY OFFER TO RELATED PRODUCTS
    let productUpdateResult;

    if (category.product === "Accessories") {
      productUpdateResult = await Accessory.updateMany(
        { category_id: category._id },
        {
          $set: {
            categoryOffer: category.offer,
          },
        }
      );
    }
    console.log("Product", productUpdateResult);
    // OPTIONAL CHECK
    if (productUpdateResult?.matchedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "No products found for this category",
      });
    }

    return res.status(OK).json({
      success: true,
      alert: "Offer applied to category and related products",
    });
  } catch (error) {
    console.log("Error from adding offer to category", error);
    next(error);
  }
};

const removeOfferToCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findByIdAndUpdate(categoryId, {
      $set: {
        "offer.isActive": false,
      },
    });
    await Accessory.updateMany(
      { category_id: categoryId },
      { $unset: { categoryOffer: "" } }
    );

    if (category.matchedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Category not found",
      });
    }

    if (category.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "No changes applied (offer already up to date)",
      });
    }

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from adding offer to category", error);
    next(error);
  }
};
module.exports = {
  addCategory,
  editCategory,
  softDeleteCategory,
  addOfferToCategory,
  removeOfferToCategory,
};
