const { OK, CONFLICT, BAD_REQUEST } = require("../../constant/statusCode");
const Coupon = require("../../models/admin/couponModel");

const loadCouponPage = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

    res.status(OK).render("admin/couponsManagement", { coupons });
  } catch (error) {
    console.log("Error from showing coupon page", error);
    next(error);
  }
};
const addCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      isListed,
      validFrom,
      validTo,
    } = req.body;
    //Check existing coupon
    const exist = await Coupon.findOne({ code: code.toUpperCase() });
    if (exist) {
      return res.status(CONFLICT).json({
        success: false,
        alert: "Coupon code already exists",
      });
    }

    //Validate discount
    if (discount <= 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Discount must be greater than 0",
      });
    }

    if (discountType === "percentage" && discount > 100) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Percentage discount cannot exceed 100%",
      });
    }

    //Validate dates
    if (new Date(validTo) <= new Date(validFrom)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Valid To must be after Valid From",
      });
    }
    //Create coupon
    await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: discount,
      minOrderAmount,
      usageLimit,
      usagePerUser: perUserLimit,
      isListed,
      validFrom,
      validTo,
    });

    res.status(OK).json({
      success: true,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.log("Error from add coupon", error);
    next(error);
  }
};
const editCoupon = async (req, res, next) => {
  try {
    const couponId = req.params.couponId;

    let {
      code,
      discountType,
      discount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      isListed,
      validFrom,
      validTo,
    } = req.body;

    // normalize values
    code = code?.toUpperCase().trim();
    discount = Number(discount);
    minOrderAmount = Number(minOrderAmount);
    usageLimit = Number(usageLimit);
    perUserLimit = Number(perUserLimit);
    isActive = isActive === "true";

    // Required fields
    if (!code || !discountType || !validFrom || !validTo) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Missing required fields",
      });
    }

    // Check duplicate coupon (excluding current)
    const exist = await Coupon.findOne({
      code,
      _id: { $ne: couponId },
    });

    if (exist) {
      return res.status(CONFLICT).json({
        success: false,
        alert: "Coupon code already exists",
      });
    }

    // Validate discount
    if (discount <= 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Discount must be greater than 0",
      });
    }

    if (discountType === "percentage" && discount > 100) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Percentage discount cannot exceed 100%",
      });
    }

    // Validate limits
    if (usageLimit <= 0 || perUserLimit <= 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Usage limits must be greater than 0",
      });
    }

    if (minOrderAmount < 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Minimum order amount cannot be negative",
      });
    }

    // Validate dates
    if (new Date(validTo) <= new Date(validFrom)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Valid To must be after Valid From",
      });
    }

    // Update coupon
    await Coupon.findByIdAndUpdate(
      couponId,
      {
        code,
        discountType,
        discountValue: discount,
        minOrderAmount,
        usageLimit,
        usagePerUser: perUserLimit,
        isListed,
        validFrom,
        validTo,
      },
      { new: true }
    );

    res.status(OK).json({
      success: true,
      message: "Coupon edited successfully",
    });
  } catch (error) {
    console.log("Error from edit coupon", error);
    next(error);
  }
};

const softDeleteCoupon = async (req, res, next) => {
  try {
    const couponId = req.params.couponId;
    res.status(OK).json({ success: true });
  } catch (error) {}
};
module.exports = { loadCouponPage, addCoupon, editCoupon, softDeleteCoupon };
