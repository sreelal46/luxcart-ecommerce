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
const Return = require("../../models/user/ReturnModel");
const Wishlist = require("../../models/user/wishlistModel");

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
      }
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
    const { request, subject, message } = req.body;
    const userId = req.session.user._id;
    const order = await Order.findById(orderId);
    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!order)
      return res
        .status(FORBIDDEN)
        .json({ success: false, alert: "Order not Found" });
    if (!item)
      return res
        .status(FORBIDDEN)
        .json({ success: false, alert: "Ordered item not Found" });

    await Order.updateOne(
      { _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.orderStatus": {
            requested: true,
            requestedType: request,
            reason: subject,
            description: message,
            status: "requested",
            requestedAt: new Date(),
          },
        },
      }
    );

    const newReturn = new Return({
      orderId,
      orderedId: order.orderId,
      orderItemId: itemId,
      userId,
      reason: message,
    });
    await newReturn.save();
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from order return", error);
    next(error);
  }
};
const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    if (!userId) return res.status(FORBIDDEN).redirect("/login");
    const productId = req.params.productId;
    const { variantId, productType } = req.body;
    const cart = await Cart.findOne({ userId });

    let itemIncart;
    if (productType === "car") {
      itemIncart = cart.items.find(
        (i) => i.variantId?.toString() === variantId
      );
    }

    if (productType === "accessory") {
      itemIncart = cart.items.find(
        (i) => i.accessoryId?.toString() === productId
      );
    }

    if (itemIncart)
      return res
        .status(OK)
        .json({ success: false, alert: "Product alrady in cart" });

    let product = null;
    if (productType === "car") product = await Car.findById(productId);
    if (productType === "accessory")
      product = await Accessory.findById(productId);

    if (!product) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Product not found" });
    }

    let variantCar = null;
    if (productType === "car") {
      variantCar = await carVariantModel.findById(variantId);
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        items: [],
      });
    }

    let item = null;

    if (productType === "car") {
      item = wishlist.items.find((i) => i.variantId?.toString() === variantId);
    }

    if (productType === "accessory") {
      item = wishlist.items.find(
        (i) => i.accessoryId?.toString() === productId
      );
    }

    if (!item) {
      wishlist.items.push({
        carId: productType === "car" ? productId : null,
        accessoryId: productType === "accessory" ? productId : null,
        variantId: productType === "car" ? variantId : null,
      });
    }
    await wishlist.save();
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from add to wishlist");
  }
};

const deleteFromWishlist = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;

    if (!userId) {
      return res.status(FORBIDDEN).redirect("/login");
    }

    // Load user's wishlist document
    const wishlistDoc = await Wishlist.findOne({ userId }); // <-- FIX

    if (!wishlistDoc) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Wishlist not found" });
    }

    // Remove the item
    wishlistDoc.items = wishlistDoc.items.filter(
      (item) => item._id.toString() !== itemId
    );

    // Save
    await wishlistDoc.save();

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from delete product from wishlist", error);
    next(error);
  }
};

module.exports = {
  cancelOrder,
  returnOrder,
  addToWishlist,
  deleteFromWishlist,
};
