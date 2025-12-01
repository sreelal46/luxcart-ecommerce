const { OK } = require("../../constant/statusCode");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Order = require("../../models/user/OrderModel");

const loadOrderManagement = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "",
      dateFrom = "",
      dateTo = "",
      ajax = "",
    } = req.query;

    let query = {};

    // 🔍 Search filter
    if (search.trim() !== "") {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "address.name": { $regex: search, $options: "i" } },
      ];
    }

    // 🏷 Status filter
    if (status) {
      query.orderStatus = status;
    }

    // 📅 Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("items.carId")
      .populate("items.accessoryId")
      .populate("items.variantId")
      .lean();

    // 📌 If Axios → return JSON (no render)
    if (ajax === "1") {
      return res.json({ success: true, orders });
    }

    // 📌 Normal page load → render
    res.render("admin/orders/ordersManagement", { orders });
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
    const cars = await Car.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "color price stock")
      .lean();

    const accessories = await Accessory.find({})
      .sort({ createdAt: -1 })
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();

    let fullProducts = [...cars, ...accessories];

    //stock to each product

    fullProducts = fullProducts.map((item) => {
      let mainStock = 0;

      if (item.variantIds && item.variantIds.length > 0) {
        mainStock = item.variantIds[0].stock;
      } else {
        mainStock = item.stock;
      }

      return { ...item, mainStock };
    });

    //Sort based on stock priority
    fullProducts.sort((a, b) => {
      const valA = a.mainStock === 0 ? 0 : a.mainStock < 10 ? 1 : 2;

      const valB = b.mainStock === 0 ? 0 : b.mainStock < 10 ? 1 : 2;

      return valA - valB;
    });

    res.status(OK).render("admin/stockManagement", { fullProducts });
  } catch (error) {
    console.log("Error from load stock page", error);
    next(error);
  }
};

module.exports = { loadOrderManagement, loadOneOrder, loadStockPage };
