const { OK, FORBIDDEN } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Address = require("../../models/user/addressModel");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const User = require("../../models/user/UserModel");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);

//load account page
const loadAccountPage = async (req, res, next) => {
  try {
    //finding user
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    res
      .status(OK)
      .render("user/account/welcome", { layout: "userAccountLayout", user });
  } catch (error) {
    console.log("Error from account wellcom page", error);
    next(error);
  }
};
//load profile page
const loadProfilePage = async (req, res, next) => {
  try {
    // finding user
    const userId = req.session.user._id;
    const user = await User.findById(userId).lean();

    //find user address
    const address = await Address.find({ userId }).lean();

    res.status(OK).render("user/account/profile", {
      layout: "userAccountLayout",
      user,
      address,
    });
  } catch (error) {
    console.log("Error from account profile page", error);
    next(error);
  }
};

// load edit profile page
const loadEditProfilePage = async (req, res, next) => {
  try {
    //find user
    const userId = req.params.userId;
    const user = await User.findById(userId).lean();

    res.status(OK).render("user/account/editProfile", {
      layout: "userAccountLayout",
      user,
    });
  } catch (error) {
    console.log("Error from account edit profile page", error);
    next(error);
  }
};

//load address page
const loadAddressPage = async (req, res, next) => {
  try {
    // finding address
    const userId = req.session.user._id;
    const address = await Address.find({ userId });

    res
      .status(OK)
      .render("user/account/address", { layout: "userAccountLayout", address });
  } catch (error) {
    console.log("Error from load address page", error);
    next(error);
  }
};

//load add address page
const loadAddAddressPage = (req, res) => {
  res
    .status(OK)
    .render("user/account/addAddress", { layout: "userAccountLayout" });
};

//load edit address
const loadEditAddressPage = async (req, res, next) => {
  try {
    const addressId = req.params.addressId;
    const address = await Address.findById(addressId).lean();

    res.status(OK).render("user/account/editAddress", {
      layout: "userAccountLayout",
      address,
    });
  } catch (error) {}
};

//load change password
const loadChangePassword = (req, res) => {
  res
    .status(OK)
    .render("user/account/changePassword", { layout: "userAccountLayout" });
};

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

//load cart page
const loadCartPage = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const userId = req.session.user._id;

    // Fetch cart as mongoose document
    let cart = await Cart.findOne({ userId });

    if (!cart || !cart.items.length) {
      return res.status(OK).render("user/account/cart", {
        cart: null,
        taxRate,
      });
    }

    // 🔥 FORCE recalculation (expires offers)
    cart.markModified("items");
    await cart.save();

    // Re-fetch lean version for rendering
    cart = await Cart.findOne({ userId })
      .populate("items.variantId")
      .populate("items.carId")
      .populate("items.accessoryId")
      .lean();

    res.status(OK).render("user/account/cart", {
      cart,
      taxRate,
    });
  } catch (error) {
    console.error("Error loading cart page:", error);
    next(error);
  }
};

module.exports = { loadCartPage };

//load checkout
const loadCheckoutStep1 = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const cartId = req.params.cartId;
    const address = await Address.find({ userId });

    if (!cartId) return res.status(FORBIDDEN).redirect("/cart");
    const cart = await Cart.findById(cartId);
    if (!cart.items.length) return res.status(FORBIDDEN).redirect("/cart");
    await cart.save();

    res.status(OK).render("user/checkout/checkout_Step_1_Address", {
      address,
      cart,
      taxRate,
    });
  } catch (error) {
    console.log("Error from load checkout page");
    next(error);
  }
};

const loadCheckoutStep2 = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.addressId;
    const cart = await Cart.findOne({ userId });
    req.session.addressId = addressId;

    if (!addressId) return res.status(FORBIDDEN).redirect("/cart");
    if (!cart.items.length) return res.status(FORBIDDEN).redirect("/cart");
    await cart.save();
    res.status(OK).render("user/checkout/checkout_Step_2_Select_Payment", {
      cart,
      taxRate,
    });
  } catch (error) {
    console.log("Error from load checkout page");
    next(error);
  }
};

const loadCheckoutStep3 = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const paymentMethod = req.params.paymentMethod;
    req.session.paymentMethod = paymentMethod;
    const cart = await Cart.findOne({ userId });

    if (!paymentMethod) return res.status(FORBIDDEN).redirect("/cart");
    if (!cart.items.length) return res.status(FORBIDDEN).redirect("/cart");

    await cart.save();
    res.status(OK).render("user/checkout/checkout_Step_3_Payment_", {
      cart,
      taxRate,
      advanceAmount: cart.totalAdvanceAmount,
    });
  } catch (error) {
    console.log("Error from load checkout page");
    next(error);
  }
};
const loadCheckoutStep4 = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) return res.status(FORBIDDEN).redirect("/cart");
    const populatedOrder = await Order.findById(orderId).populate(
      "items.carId items.accessoryId items.variantId"
    );

    res.render("user/checkout/checkout_Step_4_Confirmation", {
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error loading Step 4", error);
    next(error);
  }
};

module.exports = {
  loadAccountPage,
  loadProfilePage,
  loadEditProfilePage,
  loadAddressPage,
  loadAddAddressPage,
  loadEditAddressPage,
  loadChangePassword,
  loadOrderPage,
  loadCartPage,
  loadCheckoutStep1,
  loadCheckoutStep2,
  loadCheckoutStep3,
  loadCheckoutStep4,
};
