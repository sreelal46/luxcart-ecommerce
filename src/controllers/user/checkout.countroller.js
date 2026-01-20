const { FORBIDDEN } = require("../../constant/statusCode");
const Cart = require("../../models/user/CartModel");
const Order = require("../../models/user/OrderModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Payment Controller - Create Payment Intent
const payment = async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;
    const userId = req.session.user._id;
    const paymentMethod = req.params.paymentMethod;

    // Validation for payment method
    if (!paymentMethod) {
      return res.status(403).json({
        success: false,
        message: "Payment method not specified",
        redirect: "/cart",
      });
    }

    // Store payment method in session
    req.session.paymentMethod = paymentMethod;

    let finalAmount;
    let paymentDescription;
    let paymentMetadata = {
      userId: userId.toString(),
    };

    // CASE 1: Subsequent payment with orderId (partial/remaining payment)
    if (orderId) {
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount",
        });
      }

      // Verify order exists and belongs to user
      const order = await Order.findOne({ _id: orderId, userId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if order is already fully paid
      if (
        order.paymentStatus === "Paid" ||
        order.paidAmount >= order.totalAmount
      ) {
        return res.status(400).json({
          success: false,
          message: "Order is already fully paid",
        });
      }

      // Calculate remaining amount
      const remainingToPay = order.totalAmount - (order.paidAmount || 0);

      // Verify amount matches what's expected
      // Allow small floating point differences (0.01 rupee)
      if (Math.abs(parseFloat(amount) - remainingToPay) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Payment amount mismatch. Expected: ₹${remainingToPay.toFixed(2)}, Received: ₹${parseFloat(amount).toFixed(2)}`,
        });
      }

      // Store payment details in session
      req.session.paymentAmount = amount;
      req.session.paymentOrderId = orderId;

      finalAmount = amount;
      paymentDescription = `LuxCart Order ${order.orderId} - Remaining Payment`;
      paymentMetadata.orderId = orderId.toString();
      paymentMetadata.orderNumber = order.orderId;
      paymentMetadata.paymentType =
        order.paidAmount > 0
          ? "remaining"
          : order.advanceAmount > 0
            ? "advance"
            : "full";
    }
    // CASE 2: First time payment from cart
    else {
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount",
        });
      }

      // Verify cart exists and has items
      const cart = await Cart.findOne({ userId });

      if (!cart || !cart.items.length) {
        return res.status(403).json({
          success: false,
          message: "Cart is empty",
          redirect: "/cart",
        });
      }

      await cart.save();

      finalAmount = amount;
      paymentDescription = "LuxCart - Luxury Car Purchase";
      paymentMetadata.paymentType = "initial";
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      description: paymentDescription,
      metadata: paymentMetadata,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Payment initialization error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to initialize payment",
    });
    next(err);
  }
};

// Full Payment Controller - Update Order Status
const fullPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { payment_intent } = req.body;
    const userId = req.session.user._id;

    // Validation
    if (!payment_intent) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
    }

    // Find the order
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if this payment was already processed
    const existingTransaction = order.paymentTransactions.find(
      (txn) => txn.paymentIntentId === payment_intent,
    );

    if (existingTransaction && existingTransaction.status === "succeeded") {
      return res.status(400).json({
        success: false,
        message: "This payment has already been processed",
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been confirmed by Stripe",
      });
    }

    // Calculate payment details
    const paidAmount = paymentIntent.amount / 100; // Convert from paise to rupees
    const previousPaidAmount = order.paidAmount || 0;

    // Determine payment type
    let paymentType = "full";
    if (previousPaidAmount > 0) {
      paymentType = "remaining";
    } else if (order.advanceAmount > 0 && paidAmount < order.totalAmount) {
      paymentType = "advance";
    }

    // Add payment transaction using the schema method
    order.addPayment({
      paymentIntentId: payment_intent,
      amount: paidAmount,
      status: "succeeded",
      paymentMethod: "STRIPE", // Always STRIPE for this endpoint
      type: paymentType,
      paidAt: new Date(),
    });

    // CRITICAL FIX: Update Stripe payment fields even if original order was COD
    // This ensures COD orders paid via Stripe later get proper tracking
    order.stripePaymentIntentId = payment_intent;
    order.stripePaymentStatus = "succeeded";

    // Update payment method to STRIPE if it was COD originally
    // This is important for refund logic later
    if (order.paymentMethod === "COD") {
      order.paymentMethod = "STRIPE";
    }

    // Update order status if needed
    if (order.isFullyPaid) {
      // Fully paid - update all item statuses to confirmed if they're still placed
      order.items.forEach((item) => {
        if (item.fulfillmentStatus.status === "placed") {
          item.fulfillmentStatus.status = "confirmed";
          item.fulfillmentStatus.confirmedAt = new Date();
        }
      });
    } else {
      // Partially paid - just update status to partially paid
      order.paymentStatus = "Partially Paid";
    }

    // Save the order (pre-save hook will update paidAmount and remainingAmount)
    await order.save();

    // Clear cart only if this was the initial payment (full or advance)
    if (paymentType === "full" || paymentType === "advance") {
      await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
    }

    // Clear session payment data
    delete req.session.paymentMethod;
    delete req.session.paymentAmount;
    delete req.session.paymentOrderId;

    // Prepare response
    const responseMessage = order.isFullyPaid
      ? "Payment completed successfully!"
      : `Payment of ₹${paidAmount.toFixed(2)} received. Remaining: ₹${order.remainingAmount.toFixed(2)}`;

    res.json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Full payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
    next(error);
  }
};

module.exports = { payment, fullPayment };
