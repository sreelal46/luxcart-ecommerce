const {
  OK,
  CONFLICT,
  BAD_REQUEST,
  NOT_FOUND,
} = require("../../constant/statusCode");
const Coupon = require("../../models/admin/couponModel");

const loadCouponPage = async (req, res, next) => {
  try {
    let {
      search = "",
      page = 1,
      limit = 10,
      ajax,
      discountType,
      status,
      validFromDate,
      validToDate,
      minDiscount,
      maxDiscount,
      minOrderAmount,
    } = req.query;

    // Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.code = { $regex: search, $options: "i" };
    }

    // Filter by discount type
    if (discountType) {
      query.discountType = discountType;
    }

    // Filter by status (listed/unlisted)
    if (status) {
      query.isListed = status === "listed";
    }

    // Filter by valid date range
    if (validFromDate) {
      query.validFrom = { $gte: new Date(validFromDate) };
    }

    if (validToDate) {
      query.validTo = { $lte: new Date(validToDate) };
    }

    // Filter by discount value range
    if (minDiscount || maxDiscount) {
      query.discountValue = {};
      if (minDiscount) {
        query.discountValue.$gte = Number(minDiscount);
      }
      if (maxDiscount) {
        query.discountValue.$lte = Number(maxDiscount);
      }
    }

    // Filter by minimum order amount
    if (minOrderAmount) {
      query.minOrderAmount = { $gte: Number(minOrderAmount) };
    }

    // Get total count for pagination
    const totalCount = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Fetch coupons with pagination
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // AJAX response (for search/pagination/filters)
    if (ajax) {
      return res.status(200).json({
        coupons,
        pagination: {
          totalPages,
          currentPage: pageNum,
          totalCount,
        },
      });
    }

    // Initial page load
    res.status(200).render("admin/couponsManagement", {
      coupons,
      currentPage: pageNum,
      totalPages,
    });
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
      discount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      validFrom,
      validTo,
    } = req.body;

    // normalize values
    code = code?.toUpperCase().trim();
    discount = Number(discount);
    minOrderAmount = Number(minOrderAmount);
    usageLimit = Number(usageLimit);
    perUserLimit = Number(perUserLimit);

    // Required fields
    if (!code || !validFrom || !validTo) {
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
        discountValue: discount,
        minOrderAmount,
        usageLimit,
        usagePerUser: perUserLimit,
        validFrom,
        validTo,
      },
      { new: true },
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
    const { couponId } = req.params;

    if (!couponId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Coupon id not found",
      });
    }

    const coupon = await Coupon.findById(couponId);
    console.log("updated coupon", coupon);
    if (!coupon) {
      return res.status(NOT_FOUND).json({
        success: false,
        alert: "Coupon not found",
      });
    }
    if (coupon.isListed) {
      await Coupon.updateOne({ _id: couponId }, { $set: { isListed: false } });
    } else {
      await Coupon.updateOne({ _id: couponId }, { $set: { isListed: true } });
    }

    res.status(OK).json({
      success: true,
      isListed: coupon.isListed,
    });
  } catch (error) {
    console.log("error from coupon list/unlist", error);
    next(error);
  }
};

module.exports = { loadCouponPage, addCoupon, editCoupon, softDeleteCoupon };
