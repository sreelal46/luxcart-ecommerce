const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const carVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const updateWallet = require("../helper/wallectBalanceCalculater");

const cancelApprove = async (req, res, next) => {
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

    // Check if cancel was requested
    if (!item.cancel.requested) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cancel not requested for this item",
      });
    }

    // Check if already approved
    if (item.cancel.approvedAt) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cancel already approved",
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
       CALCULATIONS - FIXED TO USE ITEM TOTAL
    ============================= */
    const itemTaxAmount = item.accessoryTax || 0;
    const itemPrice = item.offerPrice || item.price || 0;
    const itemTotalAmount = item.totalItemAmount || 0;

    // CRITICAL FIX: Calculate new totals by subtracting from current order total
    // This is more accurate than recalculating from subtotal + tax
    const newTotalAmount = Math.max(0, order.totalAmount - itemTotalAmount);

    // Also update subtotal and tax for consistency
    const newSubTotal = Math.max(0, order.subtotal - itemPrice);
    const newTaxAmount = Math.max(0, order.taxAmount - itemTaxAmount);

    console.log("=== ITEM DETAILS ===");
    console.log("Item Price:", itemPrice);
    console.log("Item Tax:", itemTaxAmount);
    console.log("Item Total:", itemTotalAmount);

    /* =============================
       REFUND CALCULATION LOGIC - COMPLETELY REWRITTEN
    ============================= */
    const currentPaidAmount = order.paidAmount || 0;
    let refundAmount = 0;
    let newRemainingAmount = 0;
    let newPaidAmount = currentPaidAmount;
    let newPaymentStatus = order.paymentStatus;

    // Determine if payment was made online (Stripe)
    const canRefund =
      order.stripePaymentIntentId || order.paymentMethod === "STRIPE";

    console.log("=== CANCEL CALCULATION DEBUG ===");
    console.log("Current Total:", order.totalAmount);
    console.log("Current Paid:", currentPaidAmount);
    console.log("Current Remaining:", order.remainingAmount);
    console.log("Item Total:", itemTotalAmount);
    console.log("New Total After Cancel:", newTotalAmount);
    console.log("Can Refund (Stripe):", canRefund);
    console.log("Payment Status:", order.paymentStatus);

    /* SCENARIO 1: Fully Paid Orders */
    if (
      order.paymentStatus === "Paid" ||
      currentPaidAmount >= order.totalAmount
    ) {
      if (canRefund) {
        // Customer paid online - Issue refund for cancelled item
        refundAmount = itemTotalAmount;
        newPaidAmount = currentPaidAmount - refundAmount;

        console.log("PAID ORDER - Refunding:", refundAmount);
        console.log("New Paid Amount:", newPaidAmount);
      } else {
        // COD order marked as paid but no online payment - no refund
        refundAmount = 0;
        console.log("COD PAID ORDER - No refund");
      }

      // Calculate new remaining amount
      newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);

      console.log("New Remaining:", newRemainingAmount);

      // Determine new payment status
      if (newTotalAmount <= 0) {
        // All items cancelled
        newPaymentStatus =
          canRefund && refundAmount > 0 ? "Refunded" : "Cancelled";
      } else if (newPaidAmount >= newTotalAmount) {
        // Still fully paid
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else if (newPaidAmount > 0) {
        // Now partially paid
        newPaymentStatus = "Partially Paid";
      } else {
        // No payment left
        newPaymentStatus = "Pending";
      }
    } else if (order.paymentStatus === "Partially Paid") {
      /* SCENARIO 2: Partially Paid Orders (Advance paid) */
      // NO REFUND - Advance is non-refundable
      refundAmount = 0;

      console.log("PARTIALLY PAID - No refund (advance non-refundable)");

      // Recalculate remaining based on new total
      newRemainingAmount = Math.max(0, newTotalAmount - currentPaidAmount);

      console.log("New Remaining:", newRemainingAmount);

      // Determine new status
      if (newTotalAmount <= 0) {
        // All items cancelled - advance covered everything
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else if (currentPaidAmount >= newTotalAmount) {
        // Advance now covers full amount
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else {
        // Still partially paid
        newPaymentStatus = "Partially Paid";
      }
    } else {
      /* SCENARIO 3: Pending/Other Status Orders */
      refundAmount = 0;
      newRemainingAmount = Math.max(0, newTotalAmount - currentPaidAmount);
      newPaymentStatus = order.paymentStatus;

      console.log(
        "PENDING ORDER - No refund, New Remaining:",
        newRemainingAmount,
      );
    }

    console.log("=== FINAL CALCULATION ===");
    console.log("Refund Amount:", refundAmount);
    console.log("New Payment Status:", newPaymentStatus);
    console.log("New Total Amount:", newTotalAmount);
    console.log("New Paid Amount:", newPaidAmount);
    console.log("New Remaining Amount:", newRemainingAmount);
    console.log("===============================");

    /* =============================
       UPDATE ITEM IN ARRAY - CRITICAL FIX
       Using array filters instead of positional operator
    ============================= */
    const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);

    // Update the item directly
    order.items[itemIndex].cancel.approvedAt = new Date();
    order.items[itemIndex].cancel.refundAmount = refundAmount;
    order.items[itemIndex].fulfillmentStatus.status = "cancelled";

    // Update order-level fields
    order.subtotal = newSubTotal;
    order.taxAmount = newTaxAmount;
    order.totalAmount = newTotalAmount;
    order.remainingAmount = newRemainingAmount;
    order.paymentStatus = newPaymentStatus;

    // Add refund transaction if applicable
    if (refundAmount > 0 && canRefund) {
      order.paymentTransactions.push({
        paymentIntentId: `refund-${orderId}-${itemId}-${Date.now()}`,
        amount: refundAmount,
        status: "refunded",
        paymentMethod: "STRIPE",
        type: "refund", // Proper refund type (requires schema update)
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
    ============================= */
    if (refundAmount > 0 && canRefund) {
      console.log(
        `Crediting wallet: ₹${refundAmount} for user ${order.userId}`,
      );

      await updateWallet({
        userId: order.userId,
        amount: refundAmount,
        type: "refund",
        flow: "credit",
        message: `Cancellation refund for order ${order.orderId} - Item: ${item.productName}`,
      });
    }

    /* =============================
       CHECK IF ALL ITEMS CANCELLED
    ============================= */
    const allItemsCancelled = order.items.every(
      (item) => item.fulfillmentStatus.status === "cancelled",
    );

    // If all items are cancelled, update order-level status
    if (allItemsCancelled) {
      let finalPaymentStatus = "Cancelled";
      let finalRemainingAmount = 0;
      let finalTotalAmount = 0;

      // Determine final status based on refunds
      if (order.totalRefundAmount > 0) {
        finalPaymentStatus = "Refunded";
      } else if (order.paymentStatus === "Partially Paid") {
        // Advance was paid but not refunded
        finalPaymentStatus = "Cancelled";
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

      console.log("All items cancelled - Order status:", finalPaymentStatus);
    }

    /* =============================
       SUCCESS RESPONSE
    ============================= */
    let refundNote = "";
    if (refundAmount > 0 && canRefund) {
      refundNote = `Refund of ₹${refundAmount.toFixed(2)} issued to wallet`;
    } else if (order.paymentStatus === "Partially Paid") {
      refundNote = `No refund - Only advance was paid (₹${order.advanceAmount}) which is non-refundable. Remaining adjusted to ₹${newRemainingAmount.toFixed(2)}`;
    } else if (!canRefund) {
      refundNote = "No refund - COD order, no online payment made";
    } else {
      refundNote = "No refund - Payment not completed";
    }

    res.json({
      success: true,
      message: "Cancel approved successfully",
      data: {
        itemName: item.productName,
        itemAmount: itemTotalAmount,
        refundAmount: refundAmount,
        refundMethod: refundAmount > 0 && canRefund ? "wallet" : "none",
        refundNote: refundNote,
        originalPaymentStatus: order.paymentStatus,
        newPaymentStatus: newPaymentStatus,
        originalTotalAmount: order.totalAmount,
        newTotalAmount: newTotalAmount,
        originalPaidAmount: currentPaidAmount,
        newPaidAmount: newPaidAmount,
        newRemainingAmount: newRemainingAmount,
        totalRefundAmount: order.totalRefundAmount,
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

module.exports = { cancelApprove, cancelReject };
