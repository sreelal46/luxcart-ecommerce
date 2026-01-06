const { OK, NOT_FOUND } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Wishlist = require("../../models/user/wishlistModel");

const loadWishlistPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const wishlist = await Wishlist.findOne({ userId })
      .populate("items.carId")
      .populate("items.variantId")
      .populate("items.accessoryId");

    res.status(OK).render("user/account/wishlist", {
      layout: "userAccountLayout",
      wishlist,
    });
  } catch (error) {
    console.log("Error from loading wishlist page", error);
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
const loadReferralsPgae = async (req, res, next) => {
  try {
    res.render("user/account/referrals", { layout: "userAccountLayout" });
  } catch (error) {}
};
module.exports = { loadWishlistPage, loadOrderDetailPage, loadReferralsPgae };
