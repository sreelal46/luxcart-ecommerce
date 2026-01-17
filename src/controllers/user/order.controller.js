const { BAD_REQUEST } = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Address = require("../../models/user/addressModel");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);

const createOrder = async (req, res, next) => {
  try {
    /* ===============================
       BASIC SETUP
    =============================== */
    const userId = req.session.user._id;
    const paymentMethod = req.session.paymentMethod;
    const addressId = req.session.addressId;

    const cart = await Cart.findOne({ userId }).populate(
      "items.carId items.accessoryId items.variantId"
    );

    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    /* ===============================
       STRIPE PAYMENT VERIFICATION (for STRIP method)
    =============================== */
    let paymentIntentId = null;
    let paymentStatus = null;

    if (paymentMethod === "STRIP") {
      // Get payment_intent from query params (Stripe redirect) or body
      paymentIntentId = req.query.payment_intent || req.body.payment_intent;

      if (!paymentIntentId) {
        if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
          return res.status(400).json({
            success: false,
            message: "Payment intent not found",
          });
        }
        return res.redirect(`/cart/checkout?error=payment_not_found`);
      }

      // Verify payment with Stripe
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );
        paymentStatus = paymentIntent.status;

        // Check if payment was successful
        if (paymentIntent.status !== "succeeded") {
          console.log("Payment not succeeded:", paymentIntent.status);

          if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
            return res.status(400).json({
              success: false,
              message: `Payment ${paymentIntent.status}. Please try again.`,
            });
          }
          return res.redirect(
            `/cart/checkout?error=payment_${paymentIntent.status}`
          );
        }

        // Verify amount matches (Stripe uses smallest currency unit - paisa for INR)
        const expectedAmount = Math.round(cart.totalAfterAll * 100); // Convert to paisa
        if (paymentIntent.amount !== expectedAmount) {
          console.log("Amount mismatch:", {
            expected: expectedAmount,
            received: paymentIntent.amount,
            cartTotal: cart.totalAfterAll,
          });

          // Handle form POST vs AJAX differently
          if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
            return res.status(400).json({
              success: false,
              message: "Payment amount mismatch",
            });
          }
          // For form submission, redirect with error
          return res.redirect(`/cart/checkout?error=amount_mismatch`);
        }
      } catch (stripeError) {
        console.error("Stripe verification error:", stripeError);

        if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
          return res.status(400).json({
            success: false,
            message: "Payment verification failed",
          });
        }
        return res.redirect(`/cart/checkout?error=verification_failed`);
      }
    }

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
            message: "Not enough stock for accessory",
          });
        }
      }

      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId);
        if (!variant) throw new Error("Variant not found");

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Not enough stock for car",
          });
        }
      }
    }

    /* ===============================
       ADDRESS SNAPSHOT
    =============================== */
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

    /* ===============================
       ORDER ITEMS SNAPSHOT
    =============================== */
    const orderItems = cart.items.map((item) => {
      const baseAmount = item.offerPrice
        ? item.offerPrice * item.quantity
        : item.price * item.quantity;

      const taxAmount = item.accessoryId ? baseAmount * (taxRate / 100) : 0;

      const finalAmount = baseAmount + taxAmount - (item.advanceAmount || 0);

      return {
        carId: item.carId || null,
        variantId: item.variantId || null,
        accessoryId: item.accessoryId || null,
        productName: item.carId
          ? item.carId.name
          : item.accessoryId?.name || "Accessory",
        quantity: item.quantity,
        price: item.price,
        offerPrice: item.offerPrice || null,
        accessoryTax: item.accessoryId ? taxAmount : null,
        advanceAmount: item.advanceAmount || null,
        totalItemAmount: item.accessoryId ? finalAmount : item.price,
      };
    });

    /* ===============================
       PAYMENT CALCULATION
    =============================== */
    let advanceAmount;
    let remainingAmount;

    if (paymentMethod === "COD") {
      advanceAmount = orderItems.reduce(
        (sum, item) => sum + (item.advanceAmount || 0),
        0
      );
      remainingAmount = cart.totalAfterAll - advanceAmount;
    }
    if (paymentMethod === "STRIP" && totalAfterAll > 999999) {
      advanceAmount = 100000;
      remainingAmount = cart.totalAfterAll - advanceAmount;
    }

    /* ===============================
       ORDER DATA (SAFE BUILD)
    =============================== */
    const orderData = {
      userId,
      items: orderItems,
      address,
      paymentMethod,
      subtotal: cart.totalAmount,
      taxAmount: cart.accessoryTax,
      discount: cart.discountedPrice,
      totalAmount: cart.totalAfterAll,
      paymentStatus: paymentMethod === "STRIP" ? "Paid" : "Pending", // Payment status
    };

    // Store Stripe payment details
    if (paymentIntentId) {
      orderData.stripePaymentIntentId = paymentIntentId;
      orderData.stripePaymentStatus = paymentStatus;
    }

    if (advanceAmount !== undefined) {
      orderData.advanceAmount = advanceAmount;
      orderData.remainingAmount = remainingAmount;
    }

    if (cart.appliedCoupon && cart.appliedCoupon.couponId) {
      orderData.appliedCoupon = {
        couponId: cart.appliedCoupon.couponId,
        code: cart.appliedCoupon.code,
        discountType: cart.appliedCoupon.discountType,
        discountValue: cart.appliedCoupon.discountValue,
        couponDiscount: cart.appliedCoupon.couponDiscount,
      };
    }

    /* ===============================
       CREATE ORDER
    =============================== */
    const order = new Order(orderData);
    await order.save();

    /* ===============================
       CLEAR CART
    =============================== */
    cart.items = [];
    cart.totalAmount = 0;
    cart.accessoryTax = 0;
    cart.discountedPrice = 0;
    cart.totalAfterAll = 0;
    cart.appliedCoupon = undefined;

    await cart.save();

    /* ===============================
       REDUCE STOCK
    =============================== */
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

    /* ===============================
       RESPONSE - Handle both JSON and Form submission
    =============================== */
    // If it's an AJAX request, send JSON
    if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
      return res.json({
        success: true,
        redirect: `/cart/checkout-step-4/${order._id}`,
      });
    }

    // If it's a form POST submission, redirect directly
    return res.redirect(`/cart/checkout-step-4/${order._id}`);
  } catch (error) {
    console.error("Error from creating order", error);
    next(error);
  }
};

module.exports = { createOrder };
