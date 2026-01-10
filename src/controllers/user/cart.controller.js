const { OK } = require("../../constant/statusCode");
const Cart = require("../../models/user/CartModel");
const Coupon = require("../../models/admin/couponModel");

/* ================= APPLY COUPON ================= */
const applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const userId = req.user._id; // Assuming user is authenticated

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Apply coupon using the cart method
    const result = await cart.applyCoupon(couponId);

    if (!result.success) {
      return res.status(OK).json({
        success: false,
        alert: result.success.alert || "Somthing went wrong",
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(couponId, {
      $push: { usedBy: userId },
    });

    if (!coupon) {
      return res.status(OK).json({
        success: false,
        alert: "Coupon not found",
      });
    }

    return res.status(OK).json({
      success: true,
    });
  } catch (error) {
    console.error("[APPLY COUPON] Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to apply coupon",
    });
  }
};

/* ================= REMOVE COUPON ================= */
const removeCoupon = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (!cart.appliedCoupon?.couponId) {
      return res.status(400).json({
        success: false,
        message: "No coupon applied to remove",
      });
    }

    const result = await cart.removeCoupon();

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("[REMOVE COUPON] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove coupon",
    });
  }
};

/* ================= GET AVAILABLE COUPONS ================= */
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Find valid coupons
    const coupons = await Coupon.find({
      isListed: true,
      validFrom: { $lte: now },
      validTo: { $gt: now },
      minOrderAmount: { $lte: cart.totalAmount },
    }).select("-usedBy");

    // Filter coupons based on usage limits
    const availableCoupons = [];

    for (const coupon of coupons) {
      const fullCoupon = await Coupon.findById(coupon._id);

      // Check total usage limit
      if (fullCoupon.usedBy.length >= fullCoupon.usageLimit) {
        continue;
      }

      // Check per-user usage
      const userUsageCount = fullCoupon.usedBy.filter(
        (id) => id.toString() === userId.toString()
      ).length;

      if (userUsageCount >= fullCoupon.usagePerUser) {
        continue;
      }

      // Calculate potential discount
      let potentialDiscount = 0;
      if (fullCoupon.discountType === "flat") {
        potentialDiscount = fullCoupon.discountValue;
      } else if (fullCoupon.discountType === "percentage") {
        potentialDiscount =
          Math.round(
            ((cart.totalAmount * fullCoupon.discountValue) / 100) * 100
          ) / 100;
      }

      potentialDiscount = Math.min(potentialDiscount, cart.totalAmount);

      availableCoupons.push({
        _id: fullCoupon._id,
        code: fullCoupon.code,
        discountType: fullCoupon.discountType,
        discountValue: fullCoupon.discountValue,
        minOrderAmount: fullCoupon.minOrderAmount,
        validFrom: fullCoupon.validFrom,
        validTo: fullCoupon.validTo,
        potentialDiscount,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        coupons: availableCoupons,
        cartTotal: cart.totalAmount,
      },
    });
  } catch (error) {
    console.error("[GET COUPONS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
};

module.exports = { applyCoupon, getAvailableCoupons, removeCoupon };
