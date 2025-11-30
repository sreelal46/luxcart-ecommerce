const { NOT_FOUND } = require("../../constant/statusCode");
const carVariantModel = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Car = require("../../models/admin/productCarModal");
const Cart = require("../../models/user/CartModel");

const directBuy = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { productType, productId, variantId, directBuy } = req.body;

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

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    let item = null;

    if (productType === "car") {
      item = cart.items.find((i) => i.variantId?.toString() === variantId);
    }

    if (productType === "accessory") {
      item = cart.items.find((i) => i.accessoryId?.toString() === productId);
    }

    if (!item) {
      cart.items.push({
        carId: productType === "car" ? productId : null,
        accessoryId: productType === "accessory" ? productId : null,
        variantId: productType === "car" ? variantId : null,
        quantity: 1,
        price: variantCar?.price || product.price,
      });
    }

    await cart.save();

    //direct buy
    if (directBuy)
      return res.status(OK).json({
        success: true,
        redirect: `/cart/checkout-step-1/${cart._id}`,
      });
    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from add to cart", error);
    next(error);
  }
};
