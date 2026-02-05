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
        (i) => i.variantId?.toString() === variantId,
      );
    }

    if (productType === "accessory") {
      itemIncart = cart.items.find(
        (i) => i.accessoryId?.toString() === productId,
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
        (i) => i.accessoryId?.toString() === productId,
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
      (item) => item._id.toString() !== itemId,
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
  addToWishlist,
  deleteFromWishlist,
  loadWishlistPage,
};
