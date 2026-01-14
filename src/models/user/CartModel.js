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
    accessoryTax: { type: Number, required: true },
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

    // Individual category totals at base price
    carTotal: { type: Number, default: 0 },
    accessoryTotal: { type: Number, default: 0 },

    // Tax calculation
    accessoryTax: { type: Number, default: 0 },

    // Total amount at base prices (before any offers)
    totalAmount: { type: Number, default: 0 },

    // Total amount after product/category offers applied (before coupon)
    totalOfferAmount: { type: Number, default: 0 },

    // Total discount from product/category offers + coupon
    discountedPrice: { type: Number, default: 0 },

    // Final total after all discounts (offers + coupon) and taxes
    totalAfterAll: { type: Number, default: 0 },

    // Total advance payment amount required
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

    // Validate coupon expiry dates
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo))
      return {
        success: false,
        alert: "Coupon has expired or is not yet valid",
      };

    // Clean corrupted usedBy entries (remove null/undefined values)
    const cleanUsedBy = (coupon.usedBy || []).filter((id) => id);

    // Check total usage limit
    if (cleanUsedBy.length >= coupon.usageLimit)
      return { success: false, alert: "Coupon usage limit exceeded" };

    // Check per-user usage limit
    const userUsageCount = cleanUsedBy.filter(
      (id) => id.toString() === this.userId.toString()
    ).length;

    if (userUsageCount >= coupon.usagePerUser)
      return {
        success: false,
        alert: "You have already used this coupon maximum times",
      };

    // Ensure cart totals are fresh before applying coupon
    await this.save();

    // Validate minimum order amount requirement
    // Use totalOfferAmount (price after offers) for minimum order check
    if (this.totalOfferAmount < coupon.minOrderAmount)
      return {
        success: false,
        alert: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      };

    // Calculate coupon discount based on type
    let couponDiscount = 0;

    if (coupon.discountType === "flat") {
      // Flat discount: direct amount off
      couponDiscount = coupon.discountValue;
    } else {
      // Percentage discount: calculate from totalOfferAmount
      couponDiscount = roundMoney(
        (this.totalOfferAmount * coupon.discountValue) / 100
      );
    }

    // Ensure discount doesn't exceed total offer amount
    couponDiscount = Math.min(couponDiscount, this.totalOfferAmount);

    // Store coupon details in cart
    this.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      couponDiscount: roundMoney(couponDiscount),
    };

    // Calculate final total: totalOfferAmount - couponDiscount + tax
    const totalAfterCoupon = roundMoney(this.totalOfferAmount - couponDiscount);
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

    // Clean corrupted usedBy values (remove null/undefined)
    const cleanUsedBy = (coupon.usedBy || []).filter((id) => id);

    // Find the last occurrence of this user's ID
    const index = cleanUsedBy
      .map((id) => id.toString())
      .lastIndexOf(userId.toString());

    if (index === -1) {
      return { success: true, alert: "Coupon already removed" };
    }

    // Remove only that one occurrence from usedBy array
    cleanUsedBy.splice(index, 1);

    coupon.usedBy = cleanUsedBy;
    await coupon.save();

    // Clear coupon data from cart
    this.appliedCoupon = {
      couponId: null,
      code: null,
      discountType: null,
      discountValue: null,
      couponDiscount: 0,
    };

    // Recalculate total without coupon: totalOfferAmount + tax
    this.totalAfterAll = roundMoney(this.totalOfferAmount + this.accessoryTax);
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

/* ================= PRE SAVE HOOK ================= */
cartSchema.pre("save", async function (next) {
  try {
    const now = new Date();

    // Initialize tracking variables for calculations
    let carTotal = 0; // Total car price at base prices
    let accessoryTotal = 0; // Total accessory price at base prices
    let carTotalWithDiscount = 0; // Total car price after offers
    let accessoryTotalWithDiscount = 0; // Total accessory price after offers
    let totalAdvanceAmount = 0; // Total advance payment required

    /* ========== LOOP THROUGH EACH CART ITEM ========== */
    for (const item of this.items) {
      /* ========== PROCESS ACCESSORY ITEMS ========== */
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId).lean();

        // Skip if accessory not found or not listed
        if (!accessory || accessory.isListed === false) continue;

        // Set base price from accessory
        item.price = roundMoney(accessory.price);

        let finalPrice = item.price;
        let hasOffer = false;
        let offerSource = null;

        // Check for active product offer
        if (accessory.productOffer?.isConfigured) {
          const from = new Date(accessory.productOffer.validFrom);
          const to = new Date(accessory.productOffer.validTo);

          // Validate offer is within valid date range and has valid price
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

        // Check for active category offer
        if (accessory.categoryOffer?.isConfigured) {
          const from = new Date(accessory.categoryOffer.validFrom);
          const to = new Date(accessory.categoryOffer.validTo);

          // Validate offer and check if it's better than product offer
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

        // Apply the best offer found (if any)
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
          // No valid offer, use base price
          item.offerPrice = null;
          item.appliedOffer = {
            source: null,
            discountType: null,
            discountValue: null,
            isActive: false,
          };
          item.lineTotal = roundMoney(item.price * item.quantity);
        }

        // Calculate advance amount based on final price (offer or base)
        const baseAdvancePrice = item.offerPrice ?? item.price;
        item.accessoryTax = roundMoney(baseAdvancePrice * (taxRate / 100));
        item.advanceAmount = roundMoney(
          baseAdvancePrice * item.quantity * (advancePercent / 100)
        );

        // Add to running totals
        totalAdvanceAmount += item.advanceAmount;
        accessoryTotal += item.price * item.quantity;
        accessoryTotalWithDiscount += item.lineTotal;
      }

      /* ========== PROCESS CAR VARIANT ITEMS ========== */
      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId).lean();

        // Skip if variant not found or not listed
        if (!variant || variant.isListed === false) continue;

        // Set base price from variant
        item.price = roundMoney(variant.price);

        let finalPrice = item.price;
        let hasOffer = false;
        let offerSource = null;

        // Check for active product offer
        if (variant.productOffer?.isConfigured) {
          const from = new Date(variant.productOffer.validFrom);
          const to = new Date(variant.productOffer.validTo);

          // Validate offer is within valid date range and has valid price
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

        // Check for active category offer
        if (variant.categoryOffer?.isConfigured) {
          const from = new Date(variant.categoryOffer.validFrom);
          const to = new Date(variant.categoryOffer.validTo);

          // Validate offer and check if it's better than product offer
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

        // Apply the best offer found (if any)
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
          // No valid offer, use base price
          item.offerPrice = null;
          item.appliedOffer = {
            source: null,
            discountType: null,
            discountValue: null,
            isActive: false,
          };
          item.lineTotal = roundMoney(item.price * item.quantity);
        }

        // Calculate advance amount based on final price (offer or base)
        const baseAdvancePrice = item.offerPrice ?? item.price;
        item.advanceAmount = roundMoney(
          baseAdvancePrice * item.quantity * (advancePercent / 100)
        );

        // Add to running totals
        totalAdvanceAmount += item.advanceAmount;
        carTotal += item.price * item.quantity;
        carTotalWithDiscount += item.lineTotal;
      }
    }

    /* ========== UPDATE CART LEVEL TOTALS ========== */

    // Store category totals at base prices
    this.carTotal = roundMoney(carTotal);
    this.accessoryTotal = roundMoney(accessoryTotal);

    // Calculate total at base prices (before any offers)
    this.totalAmount = roundMoney(carTotal + accessoryTotal);

    // Calculate total after product/category offers (stored for internal use)
    const totalAfterOffers = roundMoney(
      carTotalWithDiscount + accessoryTotalWithDiscount
    );

    // Store this in totalOfferAmount field
    this.totalOfferAmount = totalAfterOffers;

    // Calculate tax on accessories (after offers applied)
    this.accessoryTax = roundMoney(
      accessoryTotalWithDiscount * (taxRate / 100)
    );

    /* ========== VALIDATE APPLIED COUPON ========== */
    if (this.appliedCoupon?.couponId) {
      let isCouponValid = false;
      let recalculatedDiscount = 0;

      const coupon = await Coupon.findById(this.appliedCoupon.couponId).lean();

      if (coupon) {
        const validFrom = new Date(coupon.validFrom);
        const validTo = new Date(coupon.validTo);

        // Check if coupon is listed, not expired, and currently valid
        if (coupon.isListed === true && validFrom <= now && validTo > now) {
          // Check minimum order amount requirement
          if (totalAfterOffers >= coupon.minOrderAmount) {
            isCouponValid = true;

            // Recalculate coupon discount based on current cart total
            if (coupon.discountType === "flat") {
              recalculatedDiscount = coupon.discountValue;
            } else {
              // Percentage discount
              recalculatedDiscount = roundMoney(
                (totalAfterOffers * coupon.discountValue) / 100
              );
            }

            // Ensure discount doesn't exceed total after offers
            recalculatedDiscount = Math.min(
              recalculatedDiscount,
              totalAfterOffers
            );

            // Update coupon discount with recalculated value
            this.appliedCoupon.couponDiscount =
              roundMoney(recalculatedDiscount);
          }
        }
      }

      // Remove invalid or expired coupon from cart
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

    /* ========== CALCULATE FINAL TOTAL AND DISCOUNTS ========== */

    // Calculate total discount from product/category offers and coupon
    let totalDiscount = this.totalAmount - totalAfterOffers; // Discount from offers

    if (this.appliedCoupon?.couponId) {
      // Add coupon discount to total discount
      totalDiscount += this.appliedCoupon.couponDiscount;

      // With coupon: totalAfterOffers - couponDiscount + tax
      const totalAfterCoupon = roundMoney(
        totalAfterOffers - this.appliedCoupon.couponDiscount
      );
      this.totalAfterAll = roundMoney(totalAfterCoupon + this.accessoryTax);
    } else {
      // Without coupon: totalAfterOffers + tax
      this.totalAfterAll = roundMoney(totalAfterOffers + this.accessoryTax);
    }

    // Store total discount (offers + coupon)
    this.discountedPrice = roundMoney(totalDiscount);

    // Store total advance amount
    this.totalAdvanceAmount = roundMoney(totalAdvanceAmount);

    next();
  } catch (err) {
    console.error("[CART] Pre-save error:", err);
    next(err);
  }
});

module.exports = mongoose.model("Cart", cartSchema);
