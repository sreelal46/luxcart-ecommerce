const { OK, BAD_REQUEST } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const {
  recalculateAllPrices,
  recalculateAccessoryPrices,
  recalculateCarVariantPrices,
} = require("../../cron/offersCron");

const addProductOffer = async (req, res, next) => {
  try {
    const { discountType, discountValue, validFrom, validTo, productType } =
      req.body;
    const { productId } = req.params;

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
        .json({ success: false, alert: "Percentage must be 1–100" });
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

    const offerPayload = {
      discountType,
      discountValue,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      isActive: isActive, // ✅ FIX: Use calculated value
      isConfigured: true,
    };

    /* ========== SAVE OFFER ========== */
    if (productType === "accessory") {
      await Accessory.updateOne(
        { _id: productId },
        { $set: { productOffer: offerPayload } }
      );
    }

    if (productType === "car") {
      await CarVariant.updateMany(
        { product_id: productId },
        { $set: { productOffer: offerPayload } }
      );
    }

    // ✅ FIX: Trigger immediate price recalculation if offer is active
    if (isActive) {
      await recalculateAllPrices(now);
    }

    res.status(OK).json({
      success: true,
      alert: isActive
        ? "Product offer applied successfully!"
        : "Product offer scheduled. Will activate automatically on the start date.",
    });
  } catch (err) {
    next(err);
  }
};

const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { productType } = req.body;

    // ✅ Validate productType
    if (!["accessory", "car"].includes(productType)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid product type" });
    }

    // ✅ Check if product exists before removing
    if (productType === "accessory") {
      const accessory = await Accessory.findById(productId);
      if (!accessory) {
        return res
          .status(BAD_REQUEST)
          .json({ success: false, alert: "Accessory not found" });
      }

      await Accessory.updateOne(
        { _id: productId },
        { $unset: { productOffer: "" } }
      );
    } else if (productType === "car") {
      const variants = await CarVariant.find({ product_id: productId });
      if (variants.length === 0) {
        return res
          .status(BAD_REQUEST)
          .json({ success: false, alert: "Car variants not found" });
      }

      await CarVariant.updateMany(
        { product_id: productId },
        { $unset: { productOffer: "" } }
      );
    }

    // Immediately recalculate prices
    const now = new Date();
    if (productType === "accessory") {
      await recalculateAccessoryPrices();
    } else {
      await recalculateCarVariantPrices();
    }

    res.status(OK).json({
      success: true,
      alert: "Product offer removed successfully!",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { addProductOffer, removeProductOffer };
