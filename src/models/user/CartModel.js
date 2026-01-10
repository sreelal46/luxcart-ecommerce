const mongoose = require("mongoose");
const { Schema } = mongoose;

const Car = require("../admin/productCarModal");
const CarVariant = require("../admin/carVariantModel");
const Accessory = require("../admin/productAccessoryModal");
const Coupon = require("../admin/couponModel");

const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE) || 0;
const advancePercent = parseInt(process.env.ADVANCE_PAYMENT_PERCENTAGE) || 0;

/* ================= MONEY ROUNDING ================= */
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

    // Applied coupon details
    appliedCoupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
      code: { type: String, default: null },
      discountType: { type: String, default: null },
      discountValue: { type: Number, default: null },
      couponDiscount: { type: Number, default: 0 },
    },

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

/* ================= APPLY COUPON METHOD ================= */
cartSchema.methods.applyCoupon = async function (couponId) {
  try {
    const coupon = await Coupon.findOne({
      _id: couponId,
      isListed: true,
    });

    if (!coupon) return { success: false, alert: "Invalid coupon code" };

    const now = new Date();

    // Validate coupon dates
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo))
      return {
        success: false,
        alert: "Coupon has expired or is not yet valid",
      };

    // ---------------------------------
    // CLEAN corrupted usedBy entries
    // ---------------------------------
    const cleanUsedBy = (coupon.usedBy || []).filter((id) => id);

    // Total usage limit
    if (cleanUsedBy.length >= coupon.usageLimit)
      return { success: false, alert: "Coupon usage limit exceeded" };

    // Per-user usage
    const userUsageCount = cleanUsedBy.filter(
      (id) => id.toString() === this.userId.toString()
    ).length;

    if (userUsageCount >= coupon.usagePerUser)
      return {
        success: false,
        alert: "You have already used this coupon maximum times",
      };

    // Ensure cart totals are fresh
    await this.save();

    // Minimum order check
    if (this.totalAmount < coupon.minOrderAmount)
      return {
        success: false,
        alert: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      };

    // ---------------------------------
    // Calculate discount
    // ---------------------------------
    let couponDiscount = 0;

    if (coupon.discountType === "flat") {
      couponDiscount = coupon.discountValue;
    } else {
      couponDiscount = roundMoney(
        (this.totalAmount * coupon.discountValue) / 100
      );
    }

    couponDiscount = Math.min(couponDiscount, this.totalAmount);

    // ---------------------------------
    // Save coupon into cart
    // ---------------------------------
    this.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      couponDiscount: roundMoney(couponDiscount),
    };

    const totalAfterCoupon = roundMoney(this.totalAmount - couponDiscount);
    this.totalAfterAll = roundMoney(totalAfterCoupon + this.accessoryTax);

    await this.save();

    return {
      success: true,
      alert: "Coupon applied successfully",
      couponDiscount: this.appliedCoupon.couponDiscount,
      totalAfterAll: this.totalAfterAll,
    };
  } catch (error) {
    console.log("error from apply coupon", error);
    return { success: false, alert: "Server error" };
  }
};

/* ================= REMOVE COUPON METHOD ================= */
cartSchema.methods.removeCoupon = async function (userId, couponId) {
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return { success: true, alert: "Coupon not found" };
    }

    // ---------------------------------------
    // Clean corrupted values
    // ---------------------------------------
    const cleanUsedBy = (coupon.usedBy || []).filter((id) => id);

    // Find LAST usage of this user
    const index = cleanUsedBy
      .map((id) => id.toString())
      .lastIndexOf(userId.toString());

    if (index === -1) {
      return { success: true, alert: "Coupon already removed" };
    }

    // ---------------------------------------
    // Remove ONLY that one occurrence
    // ---------------------------------------
    cleanUsedBy.splice(index, 1);

    coupon.usedBy = cleanUsedBy;
    await coupon.save();

    // ---------------------------------------
    // Remove coupon from cart
    // ---------------------------------------
    this.appliedCoupon = {
      couponId: null,
      code: null,
      discountType: null,
      discountValue: null,
      couponDiscount: 0,
    };

    this.totalAfterAll = roundMoney(this.totalAmount + this.accessoryTax);
    await this.save();

    return {
      success: true,
      alert: "Coupon removed successfully",
      totalAfterAll: this.totalAfterAll,
    };
  } catch (error) {
    console.error("[REMOVE COUPON]", error);
    return { success: false, alert: "Server error" };
  }
};

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

    // Total discount from product/category offers
    this.discountedPrice = roundMoney(
      carTotal -
        carTotalWithDiscount +
        (accessoryTotal - accessoryTotalWithDiscount)
    );

    this.accessoryTax = roundMoney(
      accessoryTotalWithDiscount * (taxRate / 100)
    );

    // Total after product/category offers (before coupon)
    this.totalAmount = roundMoney(
      carTotalWithDiscount + accessoryTotalWithDiscount
    );

    /* ========== VALIDATE APPLIED COUPON ========== */
    if (this.appliedCoupon?.couponId) {
      let isCouponValid = false;

      const coupon = await Coupon.findById(this.appliedCoupon.couponId).lean();

      if (coupon) {
        const validFrom = new Date(coupon.validFrom);
        const validTo = new Date(coupon.validTo);

        // Check if coupon is listed, not expired, and currently valid
        if (coupon.isListed === true && validFrom <= now && validTo > now) {
          isCouponValid = true;
        }
      }

      // If coupon is invalid, remove it from cart
      if (!isCouponValid) {
        this.appliedCoupon = {
          couponId: null,
          code: null,
          discountType: null,
          discountValue: null,
          couponDiscount: 0,
        };
      }
    }

    // Calculate final total with coupon if applied and valid
    if (this.appliedCoupon?.couponId) {
      const totalAfterCoupon = roundMoney(
        this.totalAmount - this.appliedCoupon.couponDiscount
      );
      this.totalAfterAll = roundMoney(totalAfterCoupon + this.accessoryTax);
    } else {
      this.totalAfterAll = roundMoney(this.totalAmount + this.accessoryTax);
    }

    this.totalAdvanceAmount = roundMoney(totalAdvanceAmount);

    next();
  } catch (err) {
    console.error("[CART] Pre-save error:", err);
    next(err);
  }
});

module.exports = mongoose.model("Cart", cartSchema);
