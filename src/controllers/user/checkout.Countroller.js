const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const mongoose = require("mongoose");

const createOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod } = req.body;

    // Load user cart
    const cart = await Cart.findOne({ userId }).populate([
      { path: "items.carId" },
      { path: "items.variantId" },
      { path: "items.accessoryId" },
    ]);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Load selected address snapshot
    const selectedAddress = await Address.findOne({
      _id: addressId,
      userId,
    });

    if (!selectedAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address" });
    }

    // ---- Convert address to snapshot ----
    const addressSnapshot = {
      name: selectedAddress.name,
      phone: selectedAddress.phone,
      email: selectedAddress.email,
      addressLine: selectedAddress.addressLine,
      city: selectedAddress.city,
      state: selectedAddress.state,
      pincode: selectedAddress.pincode,
      landmark: selectedAddress.landmark,
    };

    // ---- Calculate order totals ----
    let subtotal = 0;
    let taxAmount = 0;

    const orderItems = cart.items.map((item) => {
      const price = item.price;
      const tax = item.tax || 0;
      const totalItemAmount = price + tax;

      subtotal += price;
      taxAmount += tax;

      return {
        carId: item.carId || null,
        variantId: item.variantId || null,
        accessoryId: item.accessoryId || null,
        quantity: item.quantity,
        price,
        tax,
        totalItemAmount,
      };
    });

    const shippingCharges = 0; // car delivery free? change if needed
    const discount = cart.discount || 0;

    const totalAmount = subtotal + taxAmount + shippingCharges - discount;

    // ---- Create Order ----
    const newOrder = new Order({
      userId,
      items: orderItems,
      address: addressSnapshot,
      paymentMethod,
      subtotal,
      taxAmount,
      discount,
      shippingCharges,
      totalAmount,
      paymentStatus: paymentMethod === "ONLINE" ? "pending" : "paid",
      orderStatus: "pending",
    });

    await newOrder.save();

    // ---- Clear cart after order ----
    cart.items = [];
    cart.discount = 0;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log("Error creating order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createOrder };
