const Order = require("../../models/user/OrderModel");
const User = require("../../models/user/UserModel");
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
      salesGrowth: 8,
      revenueGrowth: 12,
      ordersGrowth: 6,
      usersGrowth: 4,
      orders,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).render("admin/error");
  }
};

module.exports = { loadDashboard };
