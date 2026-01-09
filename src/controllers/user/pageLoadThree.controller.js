const { OK, NOT_FOUND } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Referral = require("../../models/user/referral.Model");
const User = require("../../models/user/UserModel");
const Wallet = require("../../models/user/walletsModel");
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
const loadReferralsPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId).lean();
    if (!user) return res.redirect("/login");

    const referrals = await Referral.find({ referrer: userId })
      .populate("referredUser", "name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const result = referrals
      .filter((ref) => ref.referredUser) // safety check
      .map((ref) => ({
        name: ref.referredUser.name,
        email: ref.referredUser.email,
        joinedAt: new Date(ref.referredUser.createdAt).toDateString(),
        status: ref.status,
        reward: ref.rewardGiven ? "Credited" : "Pending",
      }));

    return res.status(200).render("user/account/referrals", {
      layout: "userAccountLayout",
      referralCode: user.referralCode,
      result,
    });
  } catch (error) {
    console.error("Load referrals error:", error);
    next(error);
  }
};

const loadwalletPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const wallet = await Wallet.findOne({ userId });
    console.log(wallet);
    res
      .status(OK)
      .render("user/account/wallet", { layout: "userAccountLayout", wallet });
  } catch (error) {
    console.log("Error from wallet page load", error);
    next(error);
  }
};

module.exports = {
  loadWishlistPage,
  loadOrderDetailPage,
  loadReferralsPage,
  loadwalletPage,
};
