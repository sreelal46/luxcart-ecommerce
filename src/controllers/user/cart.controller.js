const { OK, BAD_REQUEST } = require("../../constant/statusCode");
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
        alert: "Coupon code is required",
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        alert: "Cart is empty",
      });
    }

    const couponExist =
      cart.appliedCoupon?.couponId &&
      cart.appliedCoupon.couponId.toString() === couponId.toString();

    if (couponExist) {
      return res.status(400).json({
        success: false,
        alert: "You alrady added this coupon",
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
      alert: error.message || "Failed to apply coupon",
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
    const couponId = cart.appliedCoupon.couponId;
    const result = await cart.removeCoupon(userId, couponId);
    if (!result.success)
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: result.success.alert,
      });

    // const userObjectId = new mongoose.Types.ObjectId(userId);

    // const coupon = await Coupon.findByIdAndUpdate(
    //   couponId,
    //   { $pull: { usedBy: userObjectId } },
    //   { new: true }
    // );

    // if (!coupon)
    //   return res
    //     .status(BAD_REQUEST)
    //     .json({ success: false, alert: "Coupon not found" });

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

module.exports = { applyCoupon, removeCoupon };
