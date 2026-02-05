const { OK, FORBIDDEN } = require("../../constant/statusCode");
const Coupon = require("../../models/admin/couponModel");
const Address = require("../../models/user/addressModel");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const User = require("../../models/user/UserModel");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);
const CarVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");

const checkAvailability = async (req, res, next) => {
  try {
    const cartId = req.params.cartId;

    if (!cartId) return res.status(FORBIDDEN).redirect("/cart");
    const cart = await Cart.findById(cartId);
    if (!cart.items.length) return res.status(FORBIDDEN).redirect("/cart");
    await cart.save();

    /* ===============================
       STOCK VALIDATION
    =============================== */
    for (const item of cart.items) {
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId);
        if (!accessory) throw new Error("Accessory not found");

        if (accessory.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sorry, there isn’t enough stock for "${accessory.name}". Please update your cart to continue checkout.`,
          });
        }
      }

      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId);
        if (!variant) throw new Error("Variant not found");

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sorry, there isn’t enough stock for "${item.carId.name}". Please update your cart to continue checkout.`,
          });
        }
      }
    }
    /* ===============================
       UNLISTED PRODUCT
    =============================== */
    for (const item of cart.items) {
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId);
        if (!accessory) throw new Error("Accessory not found");

        if (!accessory.isListed) {
          return res.status(400).json({
            success: false,
            message: `Oops! "${accessory.name}" is currently unavailable. Please remove it from your cart to continue checkout.`,
          });
        }
      }

      if (item.carId) {
        const car = await Car.findById(item.carId);
        if (!car) throw new Error("car not found");

        if (!car.isListed) {
          return res.status(400).json({
            success: false,
            message: `Oops! "${car.name}" is currently unavailable. Please remove it from your cart to continue checkout.`,
          });
        }
      }
    }

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from checkAvailability  page");
    next(error);
  }
};
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
      cartId,
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
      "items.carId items.accessoryId items.variantId",
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
  loadCheckoutStep1,
  loadCheckoutStep2,
  loadCheckoutStep3,
  loadCheckoutStep4,
  checkAvailability,
};
