const { BAD_REQUEST } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Address = require("../../models/user/addressModel");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);

const createOrder = async (req, res, next) => {
  try {
    const advancePercentage =
      Number(process.env.ADVANCE_PAYMENT_PERCENTAGE) || 10;
    const userId = req.session.user._id;
    const paymentMethod = req.session.paymentMethod;
    const addressId = req.session.addressId;
    const cart = await Cart.findOne({ userId }).populate(
      "items.carId items.accessoryId items.variantId"
    );
    if (!cart || !cart.items.length) {
      return res.redirect("/cart");
    }
    await cart.save();
    // STOCK CHECKING BEFORE UPDATING
    for (const item of cart.items) {
      // Check Accessory Stock
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId);

        if (!accessory) throw new Error("Accessory not found");

        if (accessory.stock < item.quantity) {
          return res.status(BAD_REQUEST).json({
            success: false,
            message: `Not enough stock for Accessory`,
          });
        }
      }

      // Check Variant Stock
      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId);

        if (!variant) throw new Error("Variant not found");

        if (variant.stock < item.quantity) {
          return res.status(BAD_REQUEST).json({
            success: false,
            message: `Not enough stock for Car`,
          });
        }
      }
    }

    const selectedAddress = await Address.findById(addressId);
    if (!selectedAddress) {
      return res.redirect("/checkout/address");
    }
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

    const orderItems = cart.items.map((item) => {
      const baseAmount = item.price * item.quantity;
      const taxAmount = baseAmount * (taxRate / 100);
      const itemFinalAmount = baseAmount + taxAmount;

      const itemAdvance =
        paymentMethod === "COD"
          ? Math.round((itemFinalAmount * advancePercentage) / 100)
          : itemFinalAmount;

      return {
        carId: item.carId || null,
        variantId: item.variantId || null,
        accessoryId: item.accessoryId || null,
        productName: item.carId
          ? item.carId.name
          : item.accessoryId?.name || null,
        quantity: item.quantity,
        price: item.price,
        accessoryTax: item.accessoryId ? taxAmount : null,
        totalItemAmount: item.accessoryId ? itemFinalAmount : item.price,
        advanceAmount: itemAdvance,
      };
    });

    let advanceAmount = 0;
    let remainingAmount = 0;

    const orderTotal = cart.totalAfterAll;
    if (paymentMethod === "COD") {
      advanceAmount = orderItems.reduce(
        (sum, item) => sum + item.advanceAmount,
        0
      );
      remainingAmount = orderTotal - advanceAmount;
    }

    const order = new Order({
      userId,
      items: orderItems,
      address,
      paymentMethod,
      advanceAmount: advanceAmount || null,
      remainingAmount: remainingAmount || null,
      subtotal: cart.totalAmount - cart.accessoryTax,
      taxAmount: cart.accessoryTax,
      discount: cart.discount,
      totalAmount: cart.totalAfterAll,
    });
    await order.save();

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    cart.accessoryTax = 0;
    cart.discount = 0;
    cart.totalAfterAll = 0;
    await cart.save();

    // Reduce stock
    for (const item of order.items) {
      if (item.accessoryId) {
        await Accessory.findByIdAndUpdate(item.accessoryId, {
          $inc: { stock: -item.quantity },
        });
      }
      if (item.variantId) {
        await CarVariant.findByIdAndUpdate(item.variantId, {
          $inc: { stock: -item.quantity },
        });
      }
    }
    console.log("Order item", order);
    console.log("OrderId", order._id);
    res.json({
      success: true,
      redirect: `/cart/checkout-step-4/${order._id}`,
    });
  } catch (error) {
    console.error("Error from creating order", error);
    next(error);
  }
};

module.exports = { createOrder };
