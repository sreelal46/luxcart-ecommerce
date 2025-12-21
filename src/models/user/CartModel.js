const mongoose = require("mongoose");
const { Schema } = mongoose;

const Car = require("../admin/productCarModal");
const CarVariant = require("../admin/carVariantModel");
const Accessory = require("../admin/productAccessoryModal");

const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE) || 0;
const advancePercent = parseInt(process.env.ADVANCE_PAYMENT_PERCENTAGE) || 0;

/* ================= MONEY ROUNDING ================= */
// Use 2 decimals (safe for payments)
// For INR only, you can change to Math.round(value)
const roundMoney = (value) => Math.round(value * 100) / 100;

/* ================= CART ITEM ================= */
const cartItemSchema = new Schema(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", default: null },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "CarVariant",
      default: null,
    },
    accessoryId: {
      type: Schema.Types.ObjectId,
      ref: "Accessory",
      default: null,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
      set: (v) => Math.min(5, Math.max(1, v)),
    },

    price: { type: Number, required: true },
    offerPrice: { type: Number, default: null },
    lineTotal: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },

    appliedOffer: {
      source: { type: String, default: null },
      discountType: { type: String, default: null },
      discountValue: { type: Number, default: null },
      isActive: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

/* ================= CART ================= */
const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [cartItemSchema],

    discountedPrice: { type: Number, default: 0 },
    carTotal: { type: Number, default: 0 },
    accessoryTotal: { type: Number, default: 0 },
    accessoryTax: { type: Number, default: 0 },

    totalAmount: { type: Number, default: 0 },
    totalAfterAll: { type: Number, default: 0 },
    totalAdvanceAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ================= PRE SAVE ================= */
cartSchema.pre("save", async function (next) {
  try {
    const now = new Date();

    let carTotal = 0;
    let accessoryTotal = 0;
    let carTotalWithDiscount = 0;
    let accessoryTotalWithDiscount = 0;
    let totalAdvanceAmount = 0;

    for (const item of this.items) {
      /* ========== ACCESSORY ========== */
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId).lean();
        if (!accessory || accessory.isListed === false) continue;

        item.price = roundMoney(accessory.price);

        let finalPrice = item.price;
        let hasOffer = false;
        let offerSource = null;

        // Product offer
        if (accessory.productOffer?.isConfigured) {
          const from = new Date(accessory.productOffer.validFrom);
          const to = new Date(accessory.productOffer.validTo);
          if (
            from <= now &&
            to > now &&
            accessory.offerPrices?.productPrice > 0
          ) {
            finalPrice = accessory.offerPrices.productPrice;
            hasOffer = true;
            offerSource = "PRODUCT";
          }
        }

        // Category offer
        if (accessory.categoryOffer?.isConfigured) {
          const from = new Date(accessory.categoryOffer.validFrom);
          const to = new Date(accessory.categoryOffer.validTo);
          if (
            from <= now &&
            to > now &&
            accessory.offerPrices?.categoryPrice > 0
          ) {
            if (!hasOffer || accessory.offerPrices.categoryPrice < finalPrice) {
              finalPrice = accessory.offerPrices.categoryPrice;
              hasOffer = true;
              offerSource = "CATEGORY";
            }
          }
        }

        if (hasOffer && finalPrice < item.price) {
          item.offerPrice = roundMoney(finalPrice);
          item.appliedOffer = {
            source: offerSource,
            discountType:
              offerSource === "PRODUCT"
                ? accessory.productOffer.discountType
                : accessory.categoryOffer.discountType,
            discountValue:
              offerSource === "PRODUCT"
                ? accessory.productOffer.discountValue
                : accessory.categoryOffer.discountValue,
            isActive: true,
          };
          item.lineTotal = roundMoney(item.offerPrice * item.quantity);
        } else {
          item.offerPrice = null;
          item.appliedOffer = {
            source: null,
            discountType: null,
            discountValue: null,
            isActive: false,
          };
          item.lineTotal = roundMoney(item.price * item.quantity);
        }

        const baseAdvancePrice = item.offerPrice ?? item.price;
        item.advanceAmount = roundMoney(
          baseAdvancePrice * item.quantity * (advancePercent / 100)
        );

        totalAdvanceAmount += item.advanceAmount;
        accessoryTotal += item.price * item.quantity;
        accessoryTotalWithDiscount += item.lineTotal;
      }

      /* ========== CAR VARIANT ========== */
      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId).lean();
        if (!variant || variant.isListed === false) continue;

        item.price = roundMoney(variant.price);

        let finalPrice = item.price;
        let hasOffer = false;
        let offerSource = null;

        if (variant.productOffer?.isConfigured) {
          const from = new Date(variant.productOffer.validFrom);
          const to = new Date(variant.productOffer.validTo);
          if (
            from <= now &&
            to > now &&
            variant.offerPrices?.productPrice > 0
          ) {
            finalPrice = variant.offerPrices.productPrice;
            hasOffer = true;
            offerSource = "PRODUCT";
          }
        }

        if (variant.categoryOffer?.isConfigured) {
          const from = new Date(variant.categoryOffer.validFrom);
          const to = new Date(variant.categoryOffer.validTo);
          if (
            from <= now &&
            to > now &&
            variant.offerPrices?.categoryPrice > 0
          ) {
            if (!hasOffer || variant.offerPrices.categoryPrice < finalPrice) {
              finalPrice = variant.offerPrices.categoryPrice;
              hasOffer = true;
              offerSource = "CATEGORY";
            }
          }
        }

        if (hasOffer && finalPrice < item.price) {
          item.offerPrice = roundMoney(finalPrice);
          item.appliedOffer = {
            source: offerSource,
            discountType:
              offerSource === "PRODUCT"
                ? variant.productOffer.discountType
                : variant.categoryOffer.discountType,
            discountValue:
              offerSource === "PRODUCT"
                ? variant.productOffer.discountValue
                : variant.categoryOffer.discountValue,
            isActive: true,
          };
          item.lineTotal = roundMoney(item.offerPrice * item.quantity);
        } else {
          item.offerPrice = null;
          item.appliedOffer = {
            source: null,
            discountType: null,
            discountValue: null,
            isActive: false,
          };
          item.lineTotal = roundMoney(item.price * item.quantity);
        }

        const baseAdvancePrice = item.offerPrice ?? item.price;
        item.advanceAmount = roundMoney(
          baseAdvancePrice * item.quantity * (advancePercent / 100)
        );

        totalAdvanceAmount += item.advanceAmount;
        carTotal += item.price * item.quantity;
        carTotalWithDiscount += item.lineTotal;
      }
    }

    this.carTotal = roundMoney(carTotal);
    this.accessoryTotal = roundMoney(accessoryTotal);

    this.discountedPrice = roundMoney(
      carTotal -
        carTotalWithDiscount +
        (accessoryTotal - accessoryTotalWithDiscount)
    );

    this.accessoryTax = roundMoney(
      accessoryTotalWithDiscount * (taxRate / 100)
    );

    this.totalAmount = roundMoney(
      carTotalWithDiscount + accessoryTotalWithDiscount
    );

    this.totalAfterAll = roundMoney(this.totalAmount + this.accessoryTax);

    this.totalAdvanceAmount = roundMoney(totalAdvanceAmount);

    next();
  } catch (err) {
    console.error("[CART] Pre-save error:", err);
    next(err);
  }
});

module.exports = mongoose.model("Cart", cartSchema);
