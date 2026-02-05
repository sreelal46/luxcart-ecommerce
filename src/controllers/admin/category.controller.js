const {
  OK,
  CONFLICT,
  NOT_FOUND,
  BAD_REQUEST,
} = require("../../constant/statusCode");
const Category = require("../../models/admin/categoryModel");
const {
  recalculateAllPrices,
  recalculateAccessoryPrices,
  recalculateCarVariantPrices,
} = require("../../cron/offersCron");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");

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
      await Car.updateMany({ category_id: id }, { $set: { isListed: false } });
      await Accessory.updateMany(
        { category_id: id },
        { $set: { isListed: false } },
      );
      await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    } else {
      await Car.updateMany({ category_id: id }, { $set: { isListed: true } });
      await Accessory.updateMany(
        { category_id: id },
        { $set: { isListed: true } },
      );
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

    /* ========== UPDATE CATEGORY ========== */
    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        $set: {
          offer: {
            discountType,
            discountValue,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            isActive: isActive, // ✅ FIX: Use calculated value
            isConfigured: true,
          },
        },
      },
      { new: true },
    );

    if (!category) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Category not found" });
    }

    // ✅ FIX: Trigger immediate price recalculation if offer is active
    if (isActive) {
      await recalculateAllPrices(now);
    }

    res.status(OK).json({
      success: true,
      alert: isActive
        ? "Category offer applied successfully!"
        : `Category offer scheduled. Will activate automatically on ${new Date(
            validFrom,
          ).toLocaleDateString()}.`,
    });
  } catch (err) {
    next(err);
  }
};

const removeOfferToCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    /* ========== REMOVE CATEGORY OFFER ========== */
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $unset: { offer: "" } },
      { new: true },
    );

    if (!category) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Category not found" });
    }

    // ✅ FIX: Immediately recalculate all prices
    const now = new Date();
    await recalculateAllPrices(now);

    res.status(OK).json({
      success: true,
      alert: "Category offer removed successfully!",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loadCategory,
  addCategory,
  editCategory,
  softDeleteCategory,
  addOfferToCategory,
  removeOfferToCategory,
};
