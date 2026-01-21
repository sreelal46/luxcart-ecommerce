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
const mongoose = require("mongoose");
const Wallet = require("../../models/user/walletsModel");
const updateWallet = require("../helper/wallectBalanceCalculater");

const returnApprove = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    // Ensure ObjectId
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    /* =============================
       FIND ORDER WITH VALID ITEM
    ============================= */
    const order = await Order.findOne({
      _id: orderObjectId,
      "items._id": itemObjectId,
    });

    if (!order) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Order not found",
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

    // Validate return request
    if (!item.return.requested) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Return not requested for this item",
      });
    }

    // Check if already approved
    if (item.return.approvedAt) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Return already approved",
      });
    }

    // Check if item was delivered (can only return delivered items)
    if (item.fulfillmentStatus.status !== "delivered") {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert:
          "Can only return delivered items. Use cancel for non-delivered items.",
      });
    }

    // Check if item is already returned
    if (item.fulfillmentStatus.status === "returned") {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Item already returned",
      });
    }

    /* =============================
       CALCULATIONS - FIXED TO USE ITEM TOTAL
    ============================= */
    const itemTaxAmount = item.accessoryTax || 0;
    const itemPrice = item.offerPrice || item.price || 0;
    const itemTotalAmount = item.totalItemAmount || 0;

    // CRITICAL FIX: Calculate new totals by subtracting from current order total
    const newTotalAmount = Math.max(0, order.totalAmount - itemTotalAmount);

    // Also update subtotal and tax for consistency
    const newSubTotal = Math.max(0, order.subtotal - itemPrice);
    const newTaxAmount = Math.max(0, order.taxAmount - itemTaxAmount);

    console.log("=== RETURN CALCULATION DEBUG ===");
    console.log("Item:", item.productName);
    console.log("Current Total:", order.totalAmount);
    console.log("Current Paid:", order.paidAmount || 0);
    console.log("Current Remaining:", order.remainingAmount);
    console.log("Item Total:", itemTotalAmount);
    console.log("New Total After Return:", newTotalAmount);

    /* =============================
       REFUND CALCULATION LOGIC
       Returns ALWAYS get full refund if payment was made
    ============================= */
    const currentPaidAmount = order.paidAmount || 0;
    let refundAmount = 0;
    let newRemainingAmount = 0;
    let newPaidAmount = currentPaidAmount;
    let newPaymentStatus = order.paymentStatus;

    // Determine if payment was made online (Stripe)
    const canRefund =
      order.stripePaymentIntentId || order.paymentMethod === "STRIPE";

    // For returns, we ALWAYS refund if customer paid
    if (currentPaidAmount > 0 && canRefund) {
      // Customer paid for this item - Issue refund
      refundAmount = Math.min(itemTotalAmount, currentPaidAmount);
      newPaidAmount = currentPaidAmount - refundAmount;

      console.log("RETURN - Refunding:", refundAmount);
      console.log("New Paid Amount:", newPaidAmount);
    } else if (currentPaidAmount > 0 && !canRefund) {
      // COD order that was marked as paid - still refund to wallet
      refundAmount = itemTotalAmount;
      newPaidAmount = currentPaidAmount - refundAmount;

      console.log("COD RETURN - Refunding to wallet:", refundAmount);
    }

    // Calculate new remaining amount
    newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);

    // Determine new payment status
    if (newTotalAmount <= 0) {
      // All items returned
      newPaymentStatus = refundAmount > 0 ? "Refunded" : "Cancelled";
    } else if (newPaidAmount >= newTotalAmount) {
      // Still fully paid
      newPaymentStatus = "Paid";
      newRemainingAmount = 0;
    } else if (newPaidAmount > 0) {
      // Now partially paid
      newPaymentStatus = "Partially Paid";
    } else {
      // No payment made
      newPaymentStatus = "Pending";
    }

    console.log("=== FINAL RETURN CALCULATION ===");
    console.log("Refund Amount:", refundAmount);
    console.log("New Payment Status:", newPaymentStatus);
    console.log("New Total Amount:", newTotalAmount);
    console.log("New Paid Amount:", newPaidAmount);
    console.log("New Remaining Amount:", newRemainingAmount);
    console.log("===================================");

    /* =============================
       UPDATE ITEM IN ARRAY - DIRECT MANIPULATION
    ============================= */
    const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);

    // Update the item directly
    order.items[itemIndex].return.approvedAt = new Date();
    order.items[itemIndex].return.refundAmount = refundAmount;
    order.items[itemIndex].return.refundedAt = new Date();
    order.items[itemIndex].fulfillmentStatus.status = "returned";

    // Update order-level fields
    order.subtotal = newSubTotal;
    order.taxAmount = newTaxAmount;
    order.totalAmount = newTotalAmount;
    order.remainingAmount = newRemainingAmount;
    order.paymentStatus = newPaymentStatus;

    // Add refund transaction
    if (refundAmount > 0) {
      order.paymentTransactions.push({
        paymentIntentId: `return-refund-${orderId}-${itemId}-${Date.now()}`,
        amount: refundAmount,
        status: "refunded",
        paymentMethod: order.paymentMethod,
        type: "refund", // Requires schema update to include "refund"
        paidAt: new Date(),
      });

      // Update refund tracking
      order.totalRefundAmount = (order.totalRefundAmount || 0) + refundAmount;
      order.paidAmount = newPaidAmount;
    }

    // Save the updated order
    await order.save();

    /* =============================
       STOCK UPDATING
    ============================= */
    const variantId = item.variantId;
    const accessoryId = item.accessoryId;
    const quantity = item.quantity;

    if (variantId) {
      await CarVariant.findByIdAndUpdate(variantId, {
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
       Always refund returns if payment was made
    ============================= */
    if (refundAmount > 0) {
      console.log(
        `Crediting wallet: ₹${refundAmount} for user ${order.userId}`,
      );

      await updateWallet({
        userId: order.userId,
        amount: refundAmount,
        type: "refund",
        flow: "credit",
        message: `Return refund for order ${order.orderId} - Item: ${item.productName}`,
      });
    }

    /* =============================
       CHECK IF ALL ITEMS RETURNED/CANCELLED
    ============================= */
    const allItemsReturnedOrCancelled = order.items.every(
      (item) =>
        item.fulfillmentStatus.status === "returned" ||
        item.fulfillmentStatus.status === "cancelled",
    );

    // If all items are returned/cancelled, update order-level status
    if (allItemsReturnedOrCancelled) {
      let finalPaymentStatus = "Cancelled";
      let finalRemainingAmount = 0;
      let finalTotalAmount = 0;

      // Determine final status based on refunds
      if (order.totalRefundAmount > 0) {
        finalPaymentStatus = "Refunded";
      }

      await Order.updateOne(
        { _id: orderObjectId },
        {
          $set: {
            paymentStatus: finalPaymentStatus,
            remainingAmount: finalRemainingAmount,
            totalAmount: finalTotalAmount,
            subtotal: 0,
            taxAmount: 0,
          },
        },
      );

      console.log(
        "All items returned/cancelled - Order status:",
        finalPaymentStatus,
      );
    }

    /* =============================
       SUCCESS RESPONSE
    ============================= */
    let refundNote = "";
    if (refundAmount > 0) {
      refundNote = `Refund of ₹${refundAmount.toFixed(2)} issued to wallet`;
    } else if (currentPaidAmount === 0) {
      refundNote = "No refund - Payment was not made";
    } else {
      refundNote = "Return processed";
    }

    res.json({
      success: true,
      message: "Return approved successfully",
      data: {
        itemName: item.productName,
        itemAmount: itemTotalAmount,
        refundAmount: refundAmount,
        refundMethod: refundAmount > 0 ? "wallet" : "none",
        refundNote: refundNote,
        originalPaymentStatus: order.paymentStatus,
        newPaymentStatus: newPaymentStatus,
        originalTotalAmount: order.totalAmount,
        newTotalAmount: newTotalAmount,
        originalPaidAmount: currentPaidAmount,
        newPaidAmount: newPaidAmount,
        newRemainingAmount: newRemainingAmount,
        totalRefundAmount: order.totalRefundAmount,
        allItemsProcessed: allItemsReturnedOrCancelled,
      },
    });
  } catch (err) {
    console.error("Return approve error:", err);

    // Send error response
    if (!res.headersSent) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        alert: "Failed to process return. Please try again.",
        error: err.message,
      });
    }
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
  returnApprove,
  returnReject,
};
