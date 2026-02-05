const { OK } = require("../../constant/statusCode");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Order = require("../../models/user/OrderModel");
const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const ContactMessage = require("../../models/admin/contactModal");

const loadOrderManagement = async (req, res, next) => {
  try {
    let {
      search = "",
      page = 1,
      limit = 10,
      ajax,
      paymentMethod,
      paymentStatus,
      itemStatus,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
    } = req.query;

    // Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};

    // Search filter - FIXED to handle order ID properly
    if (search.trim() !== "") {
      query.$or = [
        { orderId: { $regex: search.trim(), $options: "i" } },
        { "address.name": { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Payment Method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Payment Status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Item Status filter - searches within items array
    if (itemStatus) {
      query["items.fulfillmentStatus.status"] = itemStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) {
        query.totalAmount.$gte = Number(minAmount);
      }
      if (maxAmount) {
        query.totalAmount.$lte = Number(maxAmount);
      }
    }

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("items.carId")
      .populate("items.accessoryId")
      .populate("items.variantId")
      .lean();

    // AJAX response (for search/pagination/filters)
    if (ajax) {
      return res.status(200).json({
        success: true,
        orders,
        pagination: {
          totalPages,
          currentPage: pageNum,
          totalCount,
        },
      });
    }

    // Initial page load
    res.render("admin/orders/ordersManagement", {
      orders,
      currentPage: pageNum,
      totalPages,
    });
  } catch (error) {
    console.log("Error loading orders:", error);
    next(error);
  }
};

const loadOneOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .populate("items.carId")
      .populate("items.accessoryId")
      .populate("items.variantId")
      .lean();
    res.status(OK).render("admin/orders/orderDetails", { order });
  } catch (error) {
    console.log("Error from single order management page load", error);
    next(error);
  }
};

const loadStockPage = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search?.trim() || "";
    const productType = req.query.productType;

    // Build filter object
    const filter = {};

    // Search filter
    if (search && search !== "undefined" && search !== "") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [{ name: searchRegex }];
    }

    // Brand filter
    if (req.query.brand && req.query.brand !== "All") {
      filter.brand_id = req.query.brand;
    }

    // Category filter
    if (req.query.category && req.query.category !== "All") {
      filter.category_id = req.query.category;
    }

    let cars = [];
    let accessories = [];

    // Fetch based on product type filter
    if (!productType || productType === "All" || productType === "car") {
      cars = await Car.find(filter)
        .sort({ createdAt: -1 })
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .populate("product_type_id", "name")
        .populate("variantIds", "color price stock")
        .lean();
    }

    if (!productType || productType === "All" || productType === "accessory") {
      accessories = await Accessory.find(filter)
        .sort({ createdAt: -1 })
        .populate("brand_id", "name")
        .populate("category_id", "name")
        .populate("product_type_id", "name")
        .lean();
    }

    let fullProducts = [...cars, ...accessories];

    // Add mainStock to each product
    fullProducts = fullProducts.map((item) => {
      let mainStock = 0;

      if (item.variantIds && item.variantIds.length > 0) {
        mainStock = item.variantIds[0].stock;
      } else {
        mainStock = item.stock || 0;
      }

      return { ...item, mainStock };
    });

    // Stock Status Filter
    if (req.query.stockStatus && req.query.stockStatus !== "All") {
      if (req.query.stockStatus === "Out of Stock") {
        fullProducts = fullProducts.filter((p) => p.mainStock === 0);
      } else if (req.query.stockStatus === "Low Stock") {
        fullProducts = fullProducts.filter(
          (p) => p.mainStock > 0 && p.mainStock < 10,
        );
      } else if (req.query.stockStatus === "In Stock") {
        fullProducts = fullProducts.filter((p) => p.mainStock >= 10);
      }
    }

    // Sort based on stock priority (Out of Stock -> Low Stock -> In Stock)
    fullProducts.sort((a, b) => {
      const valA = a.mainStock === 0 ? 0 : a.mainStock < 10 ? 1 : 2;
      const valB = b.mainStock === 0 ? 0 : b.mainStock < 10 ? 1 : 2;
      return valA - valB;
    });

    // Apply pagination
    const total = fullProducts.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = fullProducts.slice(startIndex, endIndex);

    // Check if it's an AJAX request
    if (
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      (req.headers.accept && req.headers.accept.includes("application/json"))
    ) {
      return res.json({
        success: true,
        fullProducts: paginatedProducts,
        totalPages,
        currentPage: page,
      });
    }

    // Initial page load - fetch brands and categories for filters
    const brands = await Brand.find({ isListed: true }).lean();
    const categories = await Category.find({ isListed: true }).lean();

    res.status(200).render("admin/stockManagement", {
      fullProducts: paginatedProducts,
      brands,
      categories,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log("Error from load stock page", error);
    next(error);
  }
};

const loadReturnReq = async (req, res, next) => {
  try {
    const returnedItems = await Order.aggregate([
      { $unwind: "$items" },

      { $match: { "items.return.requested": true } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          orderId: 1,
          createdAt: 1,
          items: 1,
          "user.name": 1,
        },
      },
      { $sort: { "items.return.requestedAt": -1 } },
    ]);
    res.render("admin/orders/returnRequestManagement", {
      returnedItems,
    });
  } catch (error) {
    console.log("Error from load return request", error);
    next(error);
  }
};
const loadCancelReq = async (req, res, next) => {
  try {
    const cancelledItems = await Order.aggregate([
      { $unwind: "$items" },

      { $match: { "items.cancel.requested": true } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          orderId: 1,
          createdAt: 1,
          items: 1,
          "user.name": 1,
        },
      },
      { $sort: { "items.cancel.requestedAt": -1 } },
    ]);
    res.render("admin/orders/cancelRequestManagement", {
      cancelledItems,
    });
  } catch (error) {
    console.log("Error from load cancel request", error);
    next(error);
  }
};
const loadNotification = async (req, res, next) => {
  try {
    const notifications = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(OK).render("admin/notification", {
      admin: req.admin,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.log("error form load notication");
  }
};

const readNotifiction = async (req, res) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      alert: "Server error while marking notification as read",
    });
  }
};
module.exports = {
  loadOrderManagement,
  loadOneOrder,
  loadStockPage,
  loadReturnReq,
  loadCancelReq,
  loadNotification,
  readNotifiction,
};
