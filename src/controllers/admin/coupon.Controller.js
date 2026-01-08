const { OK, CONFLICT, BAD_REQUEST } = require("../../constant/statusCode");
const Coupon = require("../../models/admin/couponModel");

const loadCouponPage = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    console.log("==============coupons===========");
    console.log(coupons);
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
      isActive,
      validFrom,
      validTo,
    } = req.body;
    console.log(req.body);
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
      perUserLimit,
      isActive,
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

module.exports = { loadCouponPage, addCoupon };
