const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Referral = require("../../models/user/referral.Model");
const { updateWallet } = require("../helper/wallectBalanceCalculater");
/* ===============================================
   STATUS PROGRESSION RULES
   =============================================== */
const STATUS_HIERARCHY = {
  placed: 0,
  confirmed: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1, // Can happen at any time before delivery
  returned: -1, // Can happen after delivery
};

const STATUS_TIME_MAP = {
  placed: "placedAt",
  confirmed: "confirmedAt",
  shipped: "shippedAt",
  out_for_delivery: "out_for_deliveryAt",
  delivered: "deliveredAt",
};

/* ===============================================
   VALIDATE STATUS TRANSITION
   =============================================== */
const canTransitionStatus = (currentStatus, newStatus) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const newLevel = STATUS_HIERARCHY[newStatus];

  // Special cases: cancelled and returned
  if (newStatus === "cancelled") {
    // Can only cancel if not delivered
    return currentStatus !== "delivered";
  }

  if (newStatus === "returned") {
    // Can only return if delivered
    return currentStatus === "delivered";
  }

  // Normal progression: can only move forward
  return newLevel > currentLevel;
};

/* ===============================================
   UPDATE ALL ORDER ITEMS STATUS
   =============================================== */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

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

    // Check if any active item can transition to new status
    const hasInvalidTransition = order.items.some((item) => {
      // Skip cancelled or returned items
      if (item.cancel?.approvedAt || item.return?.approvedAt) {
        return false;
      }

      const currentStatus = item.fulfillmentStatus.status;
      return !canTransitionStatus(currentStatus, status);
    });

    if (hasInvalidTransition) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: `Cannot move backward in status progression. Current status must be before '${status}' in the fulfillment flow.`,
      });
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
      data: order,
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

    // Validate status transition
    const currentStatus = item.fulfillmentStatus.status;
    if (!canTransitionStatus(currentStatus, status)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        alert: `Cannot change status from '${currentStatus}' to '${status}'. Status can only move forward in the fulfillment flow.`,
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
      data: order,
    });
  } catch (error) {
    console.error("Error updating item status", error);
    next(error);
  }
};

/* ===============================================
   GET ORDER STATUS FLOW (HELPER FOR FRONTEND)
   =============================================== */
const getOrderStatusFlow = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(NOT_FOUND)
        .json({ success: false, alert: "Order not found" });
    }

    let currentStatus;
    let availableStatuses = [];

    if (itemId) {
      // Get status for specific item
      const item = order.items.find((i) => i._id.toString() === itemId);
      if (!item) {
        return res
          .status(NOT_FOUND)
          .json({ success: false, alert: "Item not found" });
      }

      currentStatus = item.fulfillmentStatus.status;

      // Check if item is cancelled or returned
      if (item.cancel?.approvedAt) {
        availableStatuses = [];
      } else if (item.return?.approvedAt) {
        availableStatuses = [];
      } else {
        // Get available next statuses
        availableStatuses = Object.keys(STATUS_HIERARCHY).filter((status) =>
          canTransitionStatus(currentStatus, status),
        );
      }
    } else {
      // Get status for all items (find the earliest status)
      const activeItems = order.items.filter(
        (item) => !item.cancel?.approvedAt && !item.return?.approvedAt,
      );

      if (activeItems.length === 0) {
        return res.status(OK).json({
          success: true,
          data: {
            currentStatus: "No active items",
            availableStatuses: [],
          },
        });
      }

      // Find the minimum status level among active items
      const minStatusLevel = Math.min(
        ...activeItems.map(
          (item) => STATUS_HIERARCHY[item.fulfillmentStatus.status],
        ),
      );

      currentStatus = Object.keys(STATUS_HIERARCHY).find(
        (key) => STATUS_HIERARCHY[key] === minStatusLevel,
      );

      // Get available next statuses that ALL items can transition to
      availableStatuses = Object.keys(STATUS_HIERARCHY).filter((status) =>
        activeItems.every((item) =>
          canTransitionStatus(item.fulfillmentStatus.status, status),
        ),
      );
    }

    res.status(OK).json({
      success: true,
      data: {
        currentStatus,
        availableStatuses,
        statusFlow: [
          "placed",
          "confirmed",
          "shipped",
          "out_for_delivery",
          "delivered",
        ],
      },
    });
  } catch (error) {
    console.error("Error getting order status flow", error);
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
