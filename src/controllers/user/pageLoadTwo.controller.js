const { OK } = require("../../constant/statusCode");
const carVariantModel = require("../../models/admin/carVariantModel");
const Address = require("../../models/user/addressModel");
const Cart = require("../../models/user/CartModel");
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
    res
      .status(OK)
      .render("user/account/orderHistory", { layout: "userAccountLayout" });
  } catch (error) {
    console.log("Error from order page load", error);
    next(error);
  }
};

//load cart page
const loadCartPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId })
      .populate("items.carId")
      .populate("items.variantId")
      .populate("items.accessoryId")
      .lean();
    if (cart) {
      for (let item of cart.items) {
        // Variant price update
        if (item.variantId) {
          const newPrice = item.variantId.price;

          // Update DB
          await Cart.updateOne(
            { userId, "items.variantId": item.variantId._id },
            { $set: { "items.$.price": newPrice } }
          );

          // Update the returned object too
          item.price = newPrice;
        }

        // Accessory price update
        if (item.accessoryId) {
          const newPrice = item.accessoryId.price;

          await Cart.updateOne(
            { userId, "items.accessoryId": item.accessoryId._id },
            { $set: { "items.$.price": newPrice } }
          );

          item.price = newPrice;
        }
      }
    }
    res.status(OK).render("user/account/cart", { cart, taxRate });
  } catch (error) {
    console.log("Error from cart page load", error);
    next(error);
  }
};

//load checkout
const loadCheckoutStep1 = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const cartId = req.params.cartId;
    const cart = await Cart.findById(cartId);
    const address = await Address.find({ userId });

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
    req.session.user.addressId = addressId;
    console.log("User Id", userId);
    console.log("Address ID", addressId);

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
    req.session.user.paymentMethod = paymentMethod;
    const cart = await Cart.findOne({ userId });

    const advancePercentage = parseInt(process.env.ADVANCE_PAYMENT_PERCENTAGE);

    // total amount = cart total
    const advanceAmount = Math.round(
      (cart.totalAfterAll * advancePercentage) / 100
    );

    res.status(OK).render("user/checkout/checkout_Step_3_Payment_", {
      cart,
      taxRate,
      advanceAmount,
    });
  } catch (error) {
    console.log("Error from load checkout page");
    next(error);
  }
};
const loadCheckoutStep4 = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const paymentMethod = req.session.user.paymentMethod;
    const addressId = req.session.user.addressId;
    const cart = await Cart.findOne({ userId }).populate(
      "items.carId items.accessoryId"
    );
    const selectedAddress = await Address.findById(addressId);
    const address = {
      name: selectedAddress.fullName,
      phone: selectedAddress.phone,
      email: selectedAddress.email,
      label: selectedAddress.label,
      street: selectedAddress.street,
      landmark: selectedAddress.landmark,
      city: selectedAddress.city,
      district: selectedAddress.district,
      state: selectedAddress.state,
      pincode: selectedAddress.pinCode,
    };
    const orderItem = cart.items.map((item) => {
      return {
        carId: item.carId || null,
        variantId: item.variantId || null,
        accessoryId: item.accessoryId || null,
        quantity: item.quantity || 0,
        price: item.price,
        totalItemAmount: item.lineTotal,
      };
    });

    const order = {
      userId,
      items: orderItem,
      address: address,
      paymentMethod,
      subtotal: cart.totalAmount,
      taxAmount: cart.accessoryTax,
      discount: cart.discount,
      totalAmount: cart.totalAfterAll,
    };

    await order.save();
    cart.items = [];
    await art.save();
    const advancePercentage = process.env.ADVANCE_PAYMENT_PERCENTAGE || 10;
    let advanceAmount = 0;
    let remainingAmount = 0;

    if (paymentMethod === "COD") {
      advanceAmount = Math.round((cart.totalAmount * advancePercentage) / 100);
      remainingAmount = cart.totalAmount - advanceAmount;
    }

    res.render("user/checkout/checkout_Step_4_Confirmation", {
      cart,
      selectedAddress,
      paymentMethod,
      isCOD: paymentMethod === "COD",
      advanceAmount,
      remainingAmount,
      orderStatus: "Pending",
    });
  } catch (error) {
    console.log("Error loading Step 4", error);
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
