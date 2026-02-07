const Order = require("../../models/user/OrderModel");
const User = require("../../models/user/UserModel");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");
const Category = require("../../models/admin/categoryModel");
const Brand = require("../../models/admin/brandModal");
const moment = require("moment");

const loadDashboard = async (req, res) => {
  try {
    /* ================= TIME RANGES ================= */
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();
    const monthStart = moment().startOf("month").toDate();

    /* ================= TODAY SALES ================= */
    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$paidAmount" },
        },
      },
    ]);

    const todaysSales = todaySalesAgg[0]?.total || 0;

    /* ================= MONTHLY REVENUE ================= */
    const monthlyRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$paidAmount" },
        },
      },
    ]);

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    /* ================= TOTAL ORDERS ================= */
    const totalOrders = await Order.countDocuments();

    /* ================= TOTAL USERS ================= */
    const totalUsers = await User.countDocuments({ isDeleted: false });

    /* ================= RECENT ORDERS ================= */
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("userId", "name")
      .lean();

    const orders = recentOrders.map((order) => ({
      orderId: order.orderId,
      customer: order.userId?.name || "Guest",
      product:
        order.items.length > 1
          ? `${order.items[0].productName} +${order.items.length - 1}`
          : order.items[0]?.productName,
      date: moment(order.createdAt).format("DD MMM YYYY"),
      amount: order.totalAmount,
      status: order.paymentStatus,
    }));

    res.render("admin/dashboard/dashboard", {
      username: req.session.admin?.name || "Admin",
      todaysSales,
      monthlyRevenue,
      totalOrders,
      totalUsers,
      orders,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).render("admin/error");
  }
};

/* ================= GET CHART DATA ================= */
const getChartData = async (req, res) => {
  try {
    const { filter = "yearly" } = req.query;
    let matchStage = {};
    let groupStage = {};
    let labels = [];

    const now = moment();

    switch (filter) {
      case "yearly":
        // Last 12 months
        matchStage = {
          createdAt: { $gte: moment().subtract(12, "months").toDate() },
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        };
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$paidAmount" },
          orders: { $sum: 1 },
        };
        // Generate last 12 months labels
        for (let i = 11; i >= 0; i--) {
          labels.push(moment().subtract(i, "months").format("MMM YYYY"));
        }
        break;

      case "monthly":
        // Current month - daily
        matchStage = {
          createdAt: {
            $gte: moment().startOf("month").toDate(),
            $lte: moment().endOf("month").toDate(),
          },
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        };
        groupStage = {
          _id: { $dayOfMonth: "$createdAt" },
          revenue: { $sum: "$paidAmount" },
          orders: { $sum: 1 },
        };
        // Generate days of current month
        const daysInMonth = moment().daysInMonth();
        for (let i = 1; i <= daysInMonth; i++) {
          labels.push(i.toString());
        }
        break;

      case "weekly":
        // Last 7 days
        matchStage = {
          createdAt: { $gte: moment().subtract(7, "days").toDate() },
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        };
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$paidAmount" },
          orders: { $sum: 1 },
        };
        // Generate last 7 days labels
        for (let i = 6; i >= 0; i--) {
          labels.push(moment().subtract(i, "days").format("DD MMM"));
        }
        break;

      case "daily":
        // Today - hourly
        matchStage = {
          createdAt: {
            $gte: moment().startOf("day").toDate(),
            $lte: moment().endOf("day").toDate(),
          },
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        };
        groupStage = {
          _id: { $hour: "$createdAt" },
          revenue: { $sum: "$paidAmount" },
          orders: { $sum: 1 },
        };
        // Generate 24 hours
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
        }
        break;
    }

    const chartData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } },
    ]);

    // Map data to labels
    let revenueData = new Array(labels.length).fill(0);
    let ordersData = new Array(labels.length).fill(0);

    chartData.forEach((item) => {
      let index = -1;

      switch (filter) {
        case "yearly":
          const monthYear = moment()
            .year(item._id.year)
            .month(item._id.month - 1)
            .format("MMM YYYY");
          index = labels.indexOf(monthYear);
          break;

        case "monthly":
          index = labels.indexOf(item._id.toString());
          break;

        case "weekly":
          const weekDay = moment()
            .year(item._id.year)
            .month(item._id.month - 1)
            .date(item._id.day)
            .format("DD MMM");
          index = labels.indexOf(weekDay);
          break;

        case "daily":
          index = labels.indexOf(`${item._id}:00`);
          break;
      }

      if (index !== -1) {
        revenueData[index] = item.revenue;
        ordersData[index] = item.orders;
      }
    });

    res.json({
      labels,
      revenue: revenueData,
      orders: ordersData,
    });
  } catch (error) {
    console.error("Chart Data Error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
};

/* ================= TOP 10 PRODUCTS ================= */
const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        },
      },
      {
        $group: {
          _id: {
            carId: "$items.carId",
            accessoryId: "$items.accessoryId",
            productName: "$items.productName",
          },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalItemAmount" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Fetch product details
    const products = await Promise.all(
      topProducts.map(async (item) => {
        let productDetails = null;
        let type = "Unknown";

        if (item._id.carId) {
          productDetails = await Car.findById(item._id.carId)
            .populate("brand_id", "name")
            .lean();
          type = "Car";
        } else if (item._id.accessoryId) {
          productDetails = await Accessory.findById(item._id.accessoryId)
            .populate("brand_id", "name")
            .lean();
          type = "Accessory";
        }

        return {
          name: item._id.productName,
          brand: productDetails?.brand_id?.name || "N/A",
          type,
          totalSold: item.totalSold,
          revenue: item.totalRevenue,
        };
      }),
    );

    res.json(products);
  } catch (error) {
    console.error("Top Products Error:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
};

/* ================= TOP 10 CATEGORIES ================= */
const getTopCategories = async (req, res) => {
  try {
    const topCategories = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        },
      },
      {
        $lookup: {
          from: "cars",
          localField: "items.carId",
          foreignField: "_id",
          as: "carDetails",
        },
      },
      {
        $lookup: {
          from: "accessories",
          localField: "items.accessoryId",
          foreignField: "_id",
          as: "accessoryDetails",
        },
      },
      {
        $addFields: {
          categoryId: {
            $cond: {
              if: { $gt: [{ $size: "$carDetails" }, 0] },
              then: { $arrayElemAt: ["$carDetails.category_id", 0] },
              else: { $arrayElemAt: ["$accessoryDetails.category_id", 0] },
            },
          },
        },
      },
      {
        $group: {
          _id: "$categoryId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalItemAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $project: {
          name: { $arrayElemAt: ["$categoryInfo.name", 0] },
          product: { $arrayElemAt: ["$categoryInfo.product", 0] },
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
        },
      },
    ]);

    res.json(topCategories);
  } catch (error) {
    console.error("Top Categories Error:", error);
    res.status(500).json({ error: "Failed to fetch top categories" });
  }
};

/* ================= TOP 10 BRANDS ================= */
const getTopBrands = async (req, res) => {
  try {
    const topBrands = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          paymentStatus: { $in: ["Paid", "Partially Paid"] },
        },
      },
      {
        $lookup: {
          from: "cars",
          localField: "items.carId",
          foreignField: "_id",
          as: "carDetails",
        },
      },
      {
        $lookup: {
          from: "accessories",
          localField: "items.accessoryId",
          foreignField: "_id",
          as: "accessoryDetails",
        },
      },
      {
        $addFields: {
          brandId: {
            $cond: {
              if: { $gt: [{ $size: "$carDetails" }, 0] },
              then: { $arrayElemAt: ["$carDetails.brand_id", 0] },
              else: { $arrayElemAt: ["$accessoryDetails.brand_id", 0] },
            },
          },
        },
      },
      {
        $group: {
          _id: "$brandId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalItemAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandInfo",
        },
      },
      {
        $project: {
          name: { $arrayElemAt: ["$brandInfo.name", 0] },
          country: { $arrayElemAt: ["$brandInfo.country", 0] },
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
        },
      },
    ]);

    res.json(topBrands);
  } catch (error) {
    console.error("Top Brands Error:", error);
    res.status(500).json({ error: "Failed to fetch top brands" });
  }
};

/* ================= GENERATE LEDGER BOOK ================= */
const generateLedger = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: moment(endDate).endOf("day").toDate(),
        },
      };
    }

    const ledgerData = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $project: {
          date: "$createdAt",
          orderId: 1,
          customerName: { $arrayElemAt: ["$userInfo.name", 0] },
          productName: "$items.productName",
          quantity: "$items.quantity",
          unitPrice: "$items.price",
          itemTotal: "$items.totalItemAmount",
          paymentMethod: 1,
          paymentStatus: 1,
          paidAmount: 1,
          totalAmount: 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    // Calculate summary
    const summary = {
      totalOrders: await Order.countDocuments(dateFilter),
      totalRevenue: ledgerData.reduce((sum, item) => sum + item.paidAmount, 0),
      totalPending: ledgerData
        .filter((item) => item.paymentStatus === "Pending")
        .reduce((sum, item) => sum + (item.totalAmount - item.paidAmount), 0),
    };

    res.json({
      ledger: ledgerData,
      summary,
      dateRange: {
        from: startDate || "Beginning",
        to: endDate || "Now",
      },
    });
  } catch (error) {
    console.error("Ledger Generation Error:", error);
    res.status(500).json({ error: "Failed to generate ledger" });
  }
};

module.exports = {
  loadDashboard,
  getChartData,
  getTopProducts,
  getTopCategories,
  getTopBrands,
  generateLedger,
};
