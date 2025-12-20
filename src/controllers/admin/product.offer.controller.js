const { OK, BAD_REQUEST } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");

const addProductOffer = async (req, res, next) => {
  try {
    const { discountType, discountValue, validFrom, validTo, productType } =
      req.body;
    const { productId } = req.params;
    console.log(req.body);
    console.log("ProductId", productId);
    if (!["Percentage", "Price"].includes(discountType)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid discount type" });
    }

    if (
      discountType === "Percentage" &&
      (discountValue < 1 || discountValue > 100)
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
      validFrom,
      validTo,
      isActive,
      isConfigured: true,
    };

    if (productType === "accessory") {
      await Accessory.findByIdAndUpdate(productId, {
        $set: { productOffer: offerPayload },
      });
    }

    if (productType === "car") {
      await CarVariant.updateMany(
        { product_id: productId },
        { $set: { productOffer: offerPayload } }
      );
    }

    return res
      .status(OK)
      .json({ success: true, alert: "Product offer applied" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { productType } = req.body;

    const unsetPayload = {
      productOffer: null,
      "offerPrices.productPrice": null,
      appliedOffer: null,
    };

    if (productType === "accessory") {
      await Accessory.findByIdAndUpdate(productId, { $set: unsetPayload });
    }

    if (productType === "car") {
      await CarVariant.updateMany(
        { product_id: productId },
        { $set: unsetPayload }
      );
    }

    res.status(OK).json({ success: true, alert: "Product offer removed" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = { addProductOffer, removeProductOffer };
