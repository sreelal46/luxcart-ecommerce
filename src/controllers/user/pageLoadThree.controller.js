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

    res
      .status(OK)
      .render("user/account/wishlist", {
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

    const order = await Order.findById(orderId)
      .populate("items.carId")
      .populate("items.variantId")
      .populate("items.accessoryId")
      .lean();
    if (!order) return res.status(NOT_FOUND).redirect("/account/orders");
    res.status(OK).render("user/account/orderDetail", {
      layout: "userAccountLayout",
      order,
    });
  } catch (error) {
    console.log("Error from loading order detail page", error);
    next(error);
  }
};
module.exports = { loadWishlistPage, loadOrderDetailPage };
