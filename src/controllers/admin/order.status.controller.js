const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Referral = require("../../models/user/referral.Model");
const mongoose = require("mongoose");
/* ===============================================
   UPDATE ALL ORDER ITEMS STATUS
   =============================================== */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
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
    let totalDeliveredAmount = 0;

    // Update ONLY active items
    order.items.forEach((item) => {
      // Skip cancelled or returned items
      if (item.cancel?.approvedAt || item.return?.approvedAt) {
        return;
      }

      // If marking as delivered, track the amount
      if (
        status === "delivered" &&
        item.fulfillmentStatus.status !== "delivered"
      ) {
        totalDeliveredAmount += item.totalItemAmount || 0;
      }

      item.fulfillmentStatus.status = status;

      // Set timestamp only if relevant
      const timeField = STATUS_TIME_MAP[status];
      if (timeField && !item.fulfillmentStatus[timeField]) {
        item.fulfillmentStatus[timeField] = now;
      }
    });

    /* =============================
       HANDLE PAYMENT ON DELIVERY (COD)
    ============================= */
    if (status === "delivered" && totalDeliveredAmount > 0) {
      const paymentStatus = order.paymentStatus;

      // Only update payment if COD and not fully paid
      if (
        order.paymentMethod === "COD" &&
        (paymentStatus === "Pending" || paymentStatus === "Partially Paid")
      ) {
        // Add delivered items amount to paid amount
        order.paidAmount = (order.paidAmount || 0) + totalDeliveredAmount;

        // Add payment transaction
        order.paymentTransactions.push({
          paymentIntentId: `cod-delivery-${orderId}-${Date.now()}`,
          amount: totalDeliveredAmount,
          status: "succeeded",
          paymentMethod: "COD",
          type: order.paidAmount >= order.totalAmount ? "full" : "remaining",
          paidAt: now,
        });

        // Update remaining amount
        order.remainingAmount = Math.max(
          0,
          order.totalAmount - order.paidAmount,
        );

        // Update payment status
        if (order.paidAmount >= order.totalAmount) {
          order.paymentStatus = "Paid";
          order.remainingAmount = 0;
        } else if (order.paidAmount > 0) {
          order.paymentStatus = "Partially Paid";
        }
      }
    }

    await order.save();

    /* =============================
       PROCESS REFERRAL BONUS
    ============================= */
    if (status === "delivered") {
      await processReferralAfterDelivery(order);
    }

    res.status(OK).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error from update order status", error);
    next(error);
  }
};

/* ===============================================
   UPDATE SINGLE ITEM STATUS
   =============================================== */
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

    // Find the order first to get item details
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Order not found" });
    }

    // Find the specific item
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Item not found" });
    }

    // Check if item is cancelled or returned
    if (item.cancel?.approvedAt || item.return?.approvedAt) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: "Cannot update status of cancelled or returned items",
      });
    }

    const now = new Date();
    const wasDelivered = item.fulfillmentStatus.status === "delivered";
    const isBeingDelivered = status === "delivered" && !wasDelivered;

    // Update item status
    const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);
    order.items[itemIndex].fulfillmentStatus.status = status;

    // Set timestamp
    const timeField = STATUS_TIME_MAP[status];
    if (timeField && !order.items[itemIndex].fulfillmentStatus[timeField]) {
      order.items[itemIndex].fulfillmentStatus[timeField] = now;
    }

    /* =============================
       HANDLE PAYMENT ON DELIVERY (COD)
    ============================= */
    if (isBeingDelivered) {
      const itemAmount = item.totalItemAmount || 0;
      const paymentStatus = order.paymentStatus;

      // Only update payment if COD and not fully paid
      if (
        order.paymentMethod === "COD" &&
        (paymentStatus === "Pending" || paymentStatus === "Partially Paid")
      ) {
        // Add item amount to paid amount
        order.paidAmount = (order.paidAmount || 0) + itemAmount;

        // Add payment transaction
        order.paymentTransactions.push({
          paymentIntentId: `cod-item-delivery-${orderId}-${itemId}-${Date.now()}`,
          amount: itemAmount,
          status: "succeeded",
          paymentMethod: "COD",
          type: order.paidAmount >= order.totalAmount ? "full" : "remaining",
          paidAt: now,
        });

        // Update remaining amount
        order.remainingAmount = Math.max(
          0,
          order.totalAmount - order.paidAmount,
        );

        // Update payment status
        if (order.paidAmount >= order.totalAmount) {
          order.paymentStatus = "Paid";
          order.remainingAmount = 0;
        } else if (order.paidAmount > 0) {
          order.paymentStatus = "Partially Paid";
        }
      }
    }

    await order.save();

    /* =============================
       PROCESS REFERRAL BONUS
    ============================= */
    if (status === "delivered") {
      await processReferralAfterDelivery(order);
    }

    res.status(OK).json({
      success: true,
      message: "Item status updated successfully",
    });
  } catch (error) {
    console.error("Error updating item status", error);
    next(error);
  }
};

/* ===============================================
   REFERRAL BONUS HELPER FUNCTION
   =============================================== */
async function processReferralAfterDelivery(order) {
  try {
    // Check if user has any previously delivered orders
    const deliveredBefore = await Order.findOne({
      userId: order.userId,
      "items.fulfillmentStatus.status": "delivered",
      _id: { $ne: order._id },
    });

    // If user has delivered orders before, no referral bonus
    if (deliveredBefore) return;

    // Find pending referral for this user
    const referral = await Referral.findOne({
      referredUser: order.userId,
      status: "pending",
      rewardGiven: false,
    });

    // No referral found
    if (!referral) return;

    console.log("=== PROCESSING REFERRAL BONUS ===");
    console.log("Referrer:", referral.referrer);
    console.log("Referred User:", order.userId);

    // Credit referrer (200 bonus)
    await updateWallet({
      userId: referral.referrer,
      amount: 200,
      type: "referral",
      flow: "credit",
      message: "Referral bonus - Friend's first order delivered",
    });

    // Credit referred user (100 bonus)
    await updateWallet({
      userId: order.userId,
      amount: 100,
      type: "referral",
      flow: "credit",
      message: "Referral bonus - First order delivered",
    });

    // Update referral status
    referral.status = "completed";
    referral.rewardGiven = true;
    await referral.save();

    console.log("Referral bonus processed successfully");
    console.log("==================================");
  } catch (error) {
    console.error("Error processing referral bonus:", error);
    // Don't throw error - let the main operation succeed
  }
}

module.exports = { updateSingleItemStatus, updateOrderStatus };
