const Coupon = require("../../models/admin/couponModel");
const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  UNAUTHORIZED,
  CONFLICT,
} = require("../../constant/statusCode");
const carVariantModel = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Cart = require("../../models/user/CartModel");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);

//load cart page
const loadCartPage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // =====================================
    // 1. Load cart
    // =====================================
    let cart = await Cart.findOne({ userId });

    if (!cart || !cart.items.length) {
      return res.status(OK).render("user/account/cart", {
        cart: null,
        taxRate,
        coupons: [],
        cartTotal: 0,
      });
    }

    // Force recalculation (expire offers, price changes)
    cart.markModified("items");
    await cart.save();

    // Re-fetch populated cart
    cart = await Cart.findOne({ userId })
      .populate("items.variantId")
      .populate("items.carId")
      .populate("items.accessoryId")
      .lean();

    const cartTotal = Number(cart.totalAmount) || 0;

    // =====================================
    // 2. Load all eligible coupons
    // =====================================
    const coupons = await Coupon.find({
      isListed: true,
      validFrom: { $lte: now },
      validTo: { $gt: now },
      minOrderAmount: { $lte: cartTotal },
    }).lean(); // includes usedBy array

    // =====================================
    // 3. Filter coupons by usage limits
    // =====================================
    const availableCoupons = coupons
      .filter((coupon) => {
        // Minimum cart value check
        if (cartTotal < coupon.minOrderAmount) return false;

        // Remove corrupted/null values from usedBy
        const cleanUsedBy = (coupon.usedBy || []).filter((id) => id);

        // Total usage limit
        if (cleanUsedBy.length >= coupon.usageLimit) return false;

        // Per user usage limit
        const userUsageCount = cleanUsedBy.filter(
          (id) => id.toString() === userId.toString(),
        ).length;

        if (userUsageCount >= coupon.usagePerUser) return false;

        return true;
      })
      .map((coupon) => {
        let potentialDiscount = 0;

        if (coupon.discountType === "flat") {
          potentialDiscount = coupon.discountValue;
        } else {
          potentialDiscount =
            Math.round(((cartTotal * coupon.discountValue) / 100) * 100) / 100;
        }

        potentialDiscount = Math.min(potentialDiscount, cartTotal);

        return {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          validFrom: coupon.validFrom,
          validTo: coupon.validTo,
          potentialDiscount,
        };
      });

    // =====================================
    // 4. Render Cart Page
    // =====================================
    res.status(OK).render("user/account/cart", {
      cart,
      taxRate,
      coupons: availableCoupons,
      cartTotal: cartTotal,
    });
  } catch (error) {
    console.error("[LOAD CART ERROR]:", error);
    next(error);
  }
};

/* ================= ADD TO CART ================= */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { productType, productId, variantId, directBuy } = req.body;

    let product = null;
    if (productType === "car") product = await Car.findById(productId);
    if (productType === "accessory")
      product = await Accessory.findById(productId);

    if (!product) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Product not found" });
    }

    let variantCar = null;
    if (productType === "car") {
      variantCar = await carVariantModel.findById(variantId);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    let item = null;

    if (productType === "car") {
      item = cart.items.find((i) => i.variantId?.toString() === variantId);
    }

    if (productType === "accessory") {
      item = cart.items.find((i) => i.accessoryId?.toString() === productId);
    }

    if (!item) {
      // Let the pre-save hook handle price and offer calculation
      cart.items.push({
        carId: productType === "car" ? productId : null,
        accessoryId: productType === "accessory" ? productId : null,
        variantId: productType === "car" ? variantId : null,
        quantity: 1,
        // These will be calculated in pre-save hook
        price: 0,
        offerPrice: null,
        appliedOffer: {
          source: null,
          discountType: null,
          discountValue: null,
          isActive: false,
        },
      });
    }

    await cart.save();
    req.session.directBuy = null;
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from add to cart", error);
    next(error);
  }
};
/* ================= DELETE FORM CART ================= */
const deleteFromCart = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;

    if (!userId) {
      return res.status(403).redirect("/login");
    }

    // Load user's cart document
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Cart not found" });
    }

    // Remove the item
    cart.items = cart.items.filter((item) =>
      item._id.toString() === itemId ? false : true,
    );
    if (cart.items.length === 0) {
      cart.appliedCoupon = null;
    }
    // Save to trigger pre('save')
    await cart.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error from delete product from cart", error);
    next(error);
  }
};

/* ================= CHANGE QUANTITY ================= */
const changeQuantity = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;
    const { quantityIncrease, quantityDecrease } = req.body;
    const cart = await Cart.findOne({ userId });
    const item = cart.items.find((i) => i._id.toString() === itemId);
    const accessoryId = item ? item.accessoryId : null;
    const accessory = await Accessory.findById(accessoryId.toString());

    if (!cart)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Cart not found" });

    if (!item) {
      return res.status(NOT_FOUND).json({
        success: false,
        alert: "Item not found in cart",
      });
    }

    if (!accessory)
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Accessory not found" });

    //Calculate new quantity
    let newQty = item.quantity;
    if (quantityIncrease !== null) newQty = quantityIncrease;
    if (quantityDecrease !== null) newQty = quantityDecrease;

    //Validate stock
    if (newQty > accessory.stock) {
      return res.status(CONFLICT).json({
        success: false,
        alert: `Only ${accessory.stock} items available`,
      });
    }

    //Update quantity safely
    cart.items = cart.items.map((i) => {
      if (i._id.toString() === itemId) i.quantity = newQty;
      return i;
    });

    await cart.save();
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from Change Quantity", error);
    next(error);
  }
};

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

module.exports = {
  applyCoupon,
  removeCoupon,
  addToCart,
  deleteFromCart,
  changeQuantity,
  loadCartPage,
};
