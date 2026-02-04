const {
  NOT_FOUND,
  OK,
  FORBIDDEN,
  BAD_REQUEST,
} = require("../../constant/statusCode");
const carVariantModel = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const Wishlist = require("../../models/user/wishlistModel");

//load order page
const loadOrderPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate("items.carId")
      .populate("items.variantId")
      .populate("items.accessoryId")
      .lean();

    res.status(OK).render("user/account/orderHistory", {
      layout: "userAccountLayout",
      orders,
    });
  } catch (error) {
    console.log("Error from order page load", error);
    next(error);
  }
};

const loadOrderDetailPage = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    // const orderItemId = req.params.orderItemId;
    const order = await Order.findById(orderId)
      .populate("items.carId")
      .populate("items.variantId")
      .populate("items.accessoryId")
      .lean();
    if (!order) return res.status(NOT_FOUND).redirect("/account/orders");

    // const orderItem = order.items.find(
    //   (item) => item._id.toString() === orderItemId
    // );

    res.status(OK).render("user/account/orderDetail", {
      layout: "userAccountLayout",
      order,
      // orderItem,
    });
  } catch (error) {
    console.log("Error from loading order detail page", error);
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { subject, message } = req.body;

    const order = await Order.findById(orderId);
    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!order)
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Order not Found" });
    if (!item)
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Ordered item not Found" });

    await Order.updateOne(
      { _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.cancel": {
            requested: true,
            reason: subject,
            description: message,
            requestedAt: new Date(),
          },
        },
      },
    );

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from order cancel", error);
    next(error);
  }
};
const returnOrder = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { subject, message } = req.body;

    const order = await Order.findById(orderId);
    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!order)
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Order not Found" });
    if (!item)
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Ordered item not Found" });

    await Order.updateOne(
      { _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.return": {
            requested: true,
            reason: subject,
            description: message,
            requestedAt: new Date(),
          },
        },
      },
    );
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from order return", error);
    next(error);
  }
};

module.exports = {
  cancelOrder,
  returnOrder,
  loadOrderPage,
  loadOrderDetailPage,
};
