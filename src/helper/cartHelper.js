const Cart = require("../models/user/CartModel");
const CarVariant = require("../models/admin/carVariantModel");
const Accessory = require("../models/admin/productAccessoryModal");

/**
 * Recalculate cart offers and prices
 * Call this before showing cart to user
 */
const recalculateCartOffers = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return null;

    console.log("🔄 Recalculating cart offers for user:", userId);

    // Simply save the cart - pre-save hook will recalculate everything
    await cart.save();

    return cart;
  } catch (error) {
    console.error("Error recalculating cart offers:", error);
    throw error;
  }
};

/**
 * Get cart with fresh offer calculations
 * Use this in your "get cart" endpoint
 */
const getCartWithFreshOffers = async (userId) => {
  try {
    // This will trigger pre-save hook and recalculate everything
    const cart = await recalculateCartOffers(userId);

    if (!cart) {
      return {
        items: [],
        carTotal: 0,
        accessoryTotal: 0,
        accessoryTax: 0,
        discountedPrice: 0,
        totalAmount: 0,
        totalAfterAll: 0,
      };
    }

    // Populate item details if needed
    await cart.populate([
      { path: "items.carId", select: "name brand images" },
      { path: "items.variantId", select: "variantName color price" },
      { path: "items.accessoryId", select: "name brand images price" },
    ]);

    return cart;
  } catch (error) {
    console.error("Error getting cart with fresh offers:", error);
    throw error;
  }
};

/**
 * Remove expired items from cart
 * Optional: Remove items whose products are unlisted
 */
const cleanupCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return null;

    const validItems = [];

    for (const item of cart.items) {
      let isValid = true;

      // Check if accessory still exists and is listed
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId).select(
          "isListed"
        );
        if (!accessory || accessory.isListed === false) {
          isValid = false;
          console.log(
            `Removing unlisted accessory from cart: ${item.accessoryId}`
          );
        }
      }

      // Check if variant still exists and is listed
      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId).select(
          "isListed"
        );
        if (!variant || variant.isListed === false) {
          isValid = false;
          console.log(`Removing unlisted variant from cart: ${item.variantId}`);
        }
      }

      if (isValid) {
        validItems.push(item);
      }
    }

    cart.items = validItems;
    await cart.save();

    return cart;
  } catch (error) {
    console.error("Error cleaning up cart:", error);
    throw error;
  }
};

module.exports = {
  recalculateCartOffers,
  getCartWithFreshOffers,
  cleanupCart,
};
