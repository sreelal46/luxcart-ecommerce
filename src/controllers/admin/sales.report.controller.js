const { OK } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");

const loadSalesReportPage = async (req, res, next) => {
  try {
    let {
      search = "",
      category,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
      page = 1,
      limit = 10,
      ajax,
    } = req.query;

    // 🔢 Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    let sales = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.fulfillmentStatus?.status !== "delivered") return;

        const itemCategory = item.carId
          ? "Car"
          : item.accessoryId
            ? "Accessories"
            : "Other";

        sales.push({
          buyer: order.address?.name || "N/A",
          product: item.productName,
          product_id: item._id.toString(),
          quantity: item.quantity,
          price: item.offerPrice || item.price,
          category: itemCategory,
          total: item.totalItemAmount,
          createdAt: order.createdAt,
        });
      });
    });

    /* 🔍 SEARCH */
    if (search) {
      const regex = new RegExp(search, "i");
      sales = sales.filter(
        (s) =>
          regex.test(s.buyer) ||
          regex.test(s.product) ||
          regex.test(s.category),
      );
    }

    /* 🎯 FILTERS */
    if (category) {
      sales = sales.filter((s) => s.category === category);
    }

    if (dateFrom) {
      sales = sales.filter((s) => new Date(s.createdAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      sales = sales.filter((s) => new Date(s.createdAt) <= new Date(dateTo));
    }

    if (minTotal) {
      sales = sales.filter((s) => s.total >= Number(minTotal));
    }

    if (maxTotal) {
      sales = sales.filter((s) => s.total <= Number(maxTotal));
    }

    /* 📊 TOTALS */
    let totalRevenue = 0;
    let totalItemsSold = 0;

    sales.forEach((s) => {
      totalRevenue += s.total;
      totalItemsSold += s.quantity;
    });

    const netSales = totalRevenue;

    /* 📄 PAGINATION */
    const totalCount = sales.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const paginatedSales = sales.slice(skip, skip + limitNum);

    /* 🔁 AJAX RESPONSE */
    if (ajax) {
      return res.status(200).json({
        sales: paginatedSales,
        totals: {
          totalRevenue,
          totalItemsSold,
          netSales,
        },
        pagination: {
          totalPages,
          currentPage: pageNum,
        },
      });
    }

    /* 🖥️ FIRST PAGE LOAD */
    res.render("admin/salesReport", {
      sales: paginatedSales,
      totalRevenue,
      totalItemsSold,
      netSales,
      currentPage: 1,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadSalesReportPage,
};
