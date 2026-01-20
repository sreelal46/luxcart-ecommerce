const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const carVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Order = require("../../models/user/OrderModel");
const Referral = require("../../models/user/referral.Model");
const mongoose = require("mongoose");
const Wallet = require("../../models/user/walletsModel");
const updateWallet = require("../helper/wallectBalanceCalculater");

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, target } = req.body;

    const STATUS_TIME_MAP = {
      placed: "placedAt",
      confirmed: "confirmedAt",
      shipped: "shippedAt",
      out_for_delivery: "out_for_deliveryAt",
      delivered: "deliveredAt",
    };

    const ALLOWED_STATUSES = Object.keys(STATUS_TIME_MAP).concat([
      "cancelled",
      "returned",
    ]);

    if (!ALLOWED_STATUSES.includes(status)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid status value" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Order not found" });
    }

    const now = new Date();

    // Update ONLY active items
    order.items.forEach((item) => {
      //Skip cancelled or returned items
      if (item.cancel?.approvedAt || item.return?.approvedAt) {
        return;
      }

      item.fulfillmentStatus.status = status;

      // set timestamp only if relevant
      const timeField = STATUS_TIME_MAP[status];
      if (timeField && !item.fulfillmentStatus[timeField]) {
        item.fulfillmentStatus[timeField] = now;
      }
    });

    await order.save();
    async function processReferralAfterDelivery(order) {
      const deliveredBefore = await Order.findOne({
        userId: order.userId,
        "items.fulfillmentStatus.status": "delivered",
        _id: { $ne: order._id },
      });

      if (deliveredBefore) return;

      const referral = await Referral.findOne({
        referredUser: order.userId,
        status: "pending",
        rewardGiven: false,
      });

      if (!referral) return;

      await updateWallet({
        userId: referral.referrer,
        amount: 200,
        type: "referral",
        flow: "credit",
        message: "Referral bonus",
      });

      await updateWallet({
        userId: order.userId,
        amount: 100,
        type: "referral",
        flow: "credit",
        message: "Referral bonus",
      });

      referral.status = "completed";
      referral.rewardGiven = true;
      await referral.save();
    }
    await processReferralAfterDelivery(order);

    res.status(OK).json({ success: true });
  } catch (error) {
    console.error("Error from update order status", error);
    next(error);
  }
};
const updateSingleItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const STATUS_TIME_MAP = {
      placed: "placedAt",
      confirmed: "confirmedAt",
      shipped: "shippedAt",
      out_for_delivery: "out_for_deliveryAt",
      delivered: "deliveredAt",
    };

    const ALLOWED_STATUSES = Object.keys(STATUS_TIME_MAP).concat([
      "cancelled",
      "returned",
    ]);

    if (!itemId) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Item ID is required" });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Invalid status" });
    }

    const update = {
      "items.$[item].fulfillmentStatus.status": status,
      "items.$[item].fulfillmentStatus.status": status,
    };

    const timeField = STATUS_TIME_MAP[status];
    if (timeField) {
      update[`items.$[item].fulfillmentStatus.${timeField}`] = new Date();
    }

    const result = await Order.updateOne(
      { _id: orderId },
      { $set: update },
      {
        arrayFilters: [{ "item._id": itemId }],
      },
    );

    if (result.matchedCount === 0) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Order not found" });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(BAD_REQUEST)
        .json({ success: false, alert: "Item not found or already updated" });
    }

    async function processReferralAfterDelivery(order) {
      const deliveredBefore = await Order.findOne({
        userId: order.userId,
        "items.fulfillmentStatus.status": "delivered",
        _id: { $ne: order._id },
      });

      if (deliveredBefore) return;

      const referral = await Referral.findOne({
        referredUser: order.userId,
        status: "pending",
        rewardGiven: false,
      });

      if (!referral) return;

      await updateWallet({
        userId: referral.referrer,
        amount: 200,
        type: "referral",
        flow: "credit",
        message: "Referral bonus",
      });

      await updateWallet({
        userId: order.userId,
        amount: 100,
        type: "referral",
        flow: "credit",
        message: "Referral bonus",
      });

      referral.status = "completed";
      referral.rewardGiven = true;
      await referral.save();
    }
    const order = await Order.findById(orderId);
    await processReferralAfterDelivery(order);
    res.status(OK).json({ success: true });
  } catch (error) {
    console.error("Error updating item status", error);
    next(error);
  }
};

const cancelApprove = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    // Ensure ObjectId
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    /* =============================
       FIND ORDER WITH VALID ITEM
    ============================= */
    const order = await Order.findOne(
      {
        _id: orderObjectId,
        items: {
          $elemMatch: {
            _id: itemObjectId,
            "cancel.requested": true,
            "cancel.approvedAt": { $exists: false },
          },
        },
      },
      {
        items: 1,
        advanceAmount: 1,
        remainingAmount: 1,
        totalAmount: 1,
        subtotal: 1,
        taxAmount: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        paidAmount: 1,
        orderId: 1,
        userId: 1,
        totalRefundAmount: 1,
        paymentTransactions: 1,
        stripePaymentIntentId: 1,
        stripePaymentStatus: 1,
      },
    );

    if (!order) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cancel already processed or invalid",
      });
    }

    /* =============================
       GET EXACT ITEM
    ============================= */
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Item not found",
      });
    }

    // Check if item is already cancelled
    if (item.fulfillmentStatus.status === "cancelled") {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Item already cancelled",
      });
    }

    /* =============================
       CALCULATIONS
    ============================= */
    const itemTaxAmount = item.accessoryTax || 0;
    const itemPrice = item.offerPrice || item.price || 0;
    const itemTotalAmount = item.totalItemAmount || 0;

    const newSubTotal = Math.max(0, order.subtotal - itemPrice);
    const newTaxAmount = Math.max(0, order.taxAmount - itemTaxAmount);
    const newTotalAmount = newSubTotal + newTaxAmount;

    /* =============================
       REFUND CALCULATION LOGIC
       
       SCENARIO 1: paymentStatus = "Partially Paid"
       - User paid only advance (₹1000)
       - NO REFUND - Advance is non-refundable
       - Recalculate remainingAmount = newTotalAmount - paidAmount
       
       SCENARIO 2: paymentStatus = "Paid"
       - User paid full amount
       - REFUND = itemTotalAmount
       - Refund to wallet (if paid via STRIPE)
    ============================= */
    let refundAmount = 0;
    let newRemainingAmount = 0;
    let newPaidAmount = order.paidAmount || 0;
    let newPaymentStatus = order.paymentStatus;

    // Determine if we should refund based on payment method
    // COD originally means no online payment was made initially
    // But if stripePaymentIntentId exists, payment was made via Stripe later
    const canRefund =
      order.stripePaymentIntentId || order.paymentMethod === "STRIPE";

    if (order.paymentStatus === "Paid") {
      // User has paid FULL amount
      if (canRefund) {
        // Payment was made online - Issue refund
        refundAmount = itemTotalAmount;
        newPaidAmount = (order.paidAmount || 0) - refundAmount;
      } else {
        // COD and not paid yet - No refund needed
        refundAmount = 0;
      }

      // Remaining amount after refund
      newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);

      // After refund, check new payment status
      if (newTotalAmount <= 0) {
        newPaymentStatus = canRefund ? "Refunded" : "Cancelled";
      } else {
        if (newPaidAmount >= newTotalAmount) {
          newPaymentStatus = "Paid";
          newRemainingAmount = 0;
        } else if (newPaidAmount > 0) {
          newPaymentStatus = "Partially Paid";
        } else {
          newPaymentStatus = "Pending";
        }
      }
    } else if (order.paymentStatus === "Partially Paid") {
      // User paid only advance - NO REFUND (advance is non-refundable)
      refundAmount = 0;

      // CRITICAL FIX: Recalculate remaining amount based on new total
      // remainingAmount = newTotalAmount - paidAmount
      newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);

      // Payment status logic
      if (newTotalAmount <= 0) {
        newPaymentStatus = "Paid"; // All items cancelled, advance covers it
        newRemainingAmount = 0;
      } else if (newPaidAmount >= newTotalAmount) {
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else if (newPaidAmount > 0) {
        newPaymentStatus = "Partially Paid";
      } else {
        newPaymentStatus = "Pending";
      }
    } else {
      // Other statuses (Pending, Failed, etc.) - NO REFUND
      refundAmount = 0;
      // Recalculate remaining based on new total
      newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);
      newPaymentStatus = order.paymentStatus;
    }

    /* =============================
       ATOMIC UPDATE - ORDER
    ============================= */
    const updateFields = {
      $set: {
        "items.$.cancel.approvedAt": new Date(),
        "items.$.cancel.refundAmount": refundAmount,
        "items.$.fulfillmentStatus.status": "cancelled",
        remainingAmount: newRemainingAmount,
        totalAmount: newTotalAmount,
        subtotal: newSubTotal,
        taxAmount: newTaxAmount,
        paymentStatus: newPaymentStatus,
      },
    };

    // CRITICAL FIX: Add refund transaction and update totals if applicable
    if (refundAmount > 0 && canRefund) {
      updateFields.$push = {
        paymentTransactions: {
          paymentIntentId: `refund-${orderId}-${itemId}-${Date.now()}`,
          amount: refundAmount,
          status: "refunded",
          paymentMethod: "STRIPE", // Since we're refunding to Stripe/wallet
          type: "refund",
          paidAt: new Date(),
        },
      };
      updateFields.$inc = {
        totalRefundAmount: refundAmount, // Track total refunds
        paidAmount: -refundAmount, // Reduce paid amount by refund
      };
    }

    const updateResult = await Order.updateOne(
      {
        _id: orderObjectId,
        items: {
          $elemMatch: {
            _id: itemObjectId,
            "cancel.approvedAt": { $exists: false },
          },
        },
      },
      updateFields,
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cancel already approved or item not found",
      });
    }

    /* =============================
       STOCK UPDATING
    ============================= */
    const variantId = item.variantId;
    const accessoryId = item.accessoryId;
    const quantity = item.quantity;

    if (variantId) {
      await carVariant.findByIdAndUpdate(variantId, {
        $inc: { stock: quantity },
      });
    }

    if (accessoryId) {
      await Accessory.findByIdAndUpdate(accessoryId, {
        $inc: { stock: quantity },
      });
    }

    /* =============================
       WALLET REFUND
       - Only if payment was made via Stripe (online)
       - Only for non-COD or COD-turned-Stripe payments
    ============================= */
    if (refundAmount > 0 && canRefund) {
      await updateWallet({
        userId: order.userId,
        amount: refundAmount,
        type: "refund",
        flow: "credit",
        message: `Cancellation refund for order ${order.orderId}`,
      });
    }

    /* =============================
       CHECK IF ALL ITEMS CANCELLED
    ============================= */
    // Fetch updated order to check if all items are cancelled
    const updatedOrder = await Order.findById(orderObjectId);
    const allItemsCancelled = updatedOrder.items.every(
      (item) => item.fulfillmentStatus.status === "cancelled",
    );

    // If all items are cancelled, update order-level status
    if (allItemsCancelled) {
      let finalPaymentStatus = "Cancelled";
      let finalRemainingAmount = 0;

      if (order.paymentStatus === "Paid") {
        // If was fully paid and refund was issued
        finalPaymentStatus = canRefund ? "Refunded" : "Cancelled";
      } else if (order.paymentStatus === "Partially Paid") {
        // If was partially paid (only advance), advance is not refunded
        finalPaymentStatus = "Cancelled";
        finalRemainingAmount = 0; // All items cancelled, nothing remaining
      }

      await Order.updateOne(
        { _id: orderObjectId },
        {
          $set: {
            paymentStatus: finalPaymentStatus,
            remainingAmount: finalRemainingAmount,
            totalAmount: 0,
            subtotal: 0,
            taxAmount: 0,
          },
        },
      );
    }

    /* =============================
       SUCCESS RESPONSE
    ============================= */
    let refundNote = "";
    if (order.paymentStatus === "Paid") {
      if (canRefund && refundAmount > 0) {
        refundNote = `Full refund of ₹${refundAmount.toFixed(2)} issued to wallet`;
      } else {
        refundNote = "Order cancelled - COD order, no refund needed";
      }
    } else if (order.paymentStatus === "Partially Paid") {
      refundNote = `No refund - Only advance was paid (₹${order.advanceAmount}) which is non-refundable. Remaining amount adjusted to ₹${newRemainingAmount.toFixed(2)}`;
    } else {
      refundNote = "No refund - Payment not completed";
    }

    res.json({
      success: true,
      message: "Cancel approved successfully",
      data: {
        refundAmount: refundAmount,
        refundMethod: refundAmount > 0 && canRefund ? "wallet" : "none",
        refundNote: refundNote,
        originalPaymentStatus: order.paymentStatus,
        newPaymentStatus: newPaymentStatus,
        newTotalAmount: newTotalAmount,
        newRemainingAmount: newRemainingAmount,
        allItemsCancelled: allItemsCancelled,
      },
    });
  } catch (err) {
    console.error("Cancel approve error:", err);

    // Send error response
    if (!res.headersSent) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        alert: "Failed to process cancellation. Please try again.",
        error: err.message,
      });
    }
  }
};

const cancelReject = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const result = await Order.updateOne(
      {
        _id: orderId,
        "items._id": itemId,
        "items.cancel.requested": true,
      },
      {
        $set: {
          "items.$.cancel.rejectedAt": new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Cancel request not found or already processed",
      });
    }

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from cancel approve", error);
    next(error);
  }
};
const returnApprove = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    // Ensure ObjectId
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    /* =============================
       FIND ORDER WITH VALID ITEM
    ============================= */
    const order = await Order.findOne(
      {
        _id: orderObjectId,
        items: {
          $elemMatch: {
            _id: itemObjectId,
            "return.requested": true,
            "return.approvedAt": { $exists: false },
          },
        },
      },
      {
        items: 1,
        advanceAmount: 1,
        remainingAmount: 1,
        totalAmount: 1,
        subtotal: 1,
        taxAmount: 1,
        orderId: 1,
        userId: 1,
      },
    );

    if (!order) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Return already processed or invalid",
      });
    }

    /* =============================
       GET EXACT ITEM
    ============================= */
    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Item not found",
      });
    }

    /* ==========================
       CALCULATIONS
    ============================= */
    const itemAdvanceAmount = item.advanceAmount || 0;
    const itemTaxAmount = item.accessoryTax || 0;
    const itemPrice = item.price || 0;
    const itemTotalAmount = item.totalItemAmount || 0;

    const newSubTotal = order.subtotal - itemPrice;
    const newTaxAmount = order.taxAmount - itemTaxAmount;
    const newTotalAmount = newSubTotal + newTaxAmount;
    const newAdvanceAmount = order.advanceAmount - itemAdvanceAmount;
    const newRemainingAmount = newTotalAmount - newAdvanceAmount;
    /* =============================
       ATOMIC UPDATE
    ============================= */
    const updateResult = await Order.updateOne(
      {
        _id: orderObjectId,
        items: {
          $elemMatch: {
            _id: itemObjectId,
            "return.approvedAt": { $exists: false },
          },
        },
      },
      {
        $set: {
          "items.$.return.approvedAt": new Date(),
          "items.$.return.refundAmount": itemTotalAmount,
          "items.$.fulfillmentStatus.status": "returned",
          advanceAmount: newAdvanceAmount > 0 ? newAdvanceAmount : 0,
          remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0,
          totalAmount: newTotalAmount > 0 ? newTotalAmount : 0,
          subtotal: newSubTotal > 0 ? newSubTotal : 0,
          taxAmount: newTaxAmount > 0 ? newTaxAmount : 0,
        },
        $inc: { totalRefundAmount: itemTotalAmount },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cancel already approved",
      });
    }
    /* =============================
       stock updating
    ============================= */
    const variantId = item.variantId;
    const accessoryId = item.accessoryId;
    const quantity = item.quantity;
    if (variantId) {
      await carVariant.findByIdAndUpdate(
        { _id: variantId },
        { $inc: { stock: quantity } },
      );
    }
    if (accessoryId) {
      await Accessory.findByIdAndUpdate(
        { _id: accessoryId },
        { $inc: { stock: quantity } },
      );
    }
    await updateWallet({
      userId: order.userId,
      amount: itemTotalAmount,
      type: "return",
      flow: "credit",
      message: `Order refund (${order.orderId})`,
    });
    /* =============================
       SUCCESS
    ============================= */

    res.json({
      success: true,
      message: "Cancel approved successfully",
    });
  } catch (err) {
    console.error("Cancel approve error:", err);
    next(err);
  }
};

const returnReject = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const result = await Order.updateOne(
      {
        _id: orderId,
        "items._id": itemId,
        "items.return.requested": true,
      },
      {
        $set: {
          "items.$.return.rejectedAt": new Date(),
          "items.$.fulfillmentStatus.status": "returned",
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Return request not found or already processed",
      });
    }

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from return reject", error);
    next(error);
  }
};

module.exports = {
  updateOrderStatus,
  updateSingleItemStatus,
  returnApprove,
  returnReject,
  cancelApprove,
  cancelReject,
};
