const {
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = require("../../constant/statusCode");
const CarVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const updateWallet = require("../helper/wallectBalanceCalculater");
const Wallet = require("../../models/user/walletsModel");
const mongoose = require("mongoose");
const Order = require("../../models/user/OrderModel");

const loadCancelReq = async (req, res, next) => {
  try {
    const cancelledItems = await Order.aggregate([
      { $unwind: "$items" },

      { $match: { "items.cancel.requested": true } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          orderId: 1,
          createdAt: 1,
          items: 1,
          "user.name": 1,
        },
      },
      { $sort: { "items.cancel.requestedAt": -1 } },
    ]);
    res.render("admin/orders/cancelRequestManagement", {
      cancelledItems,
    });
  } catch (error) {
    console.log("Error from load cancel request", error);
    next(error);
  }
};

const cancelApprove = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    const order = await Order.findOne({
      _id: orderObjectId,
      "items._id": itemObjectId,
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        alert: "Order not found",
      });
    }

    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) {
      return res.status(400).json({
        success: false,
        alert: "Item not found",
      });
    }

    if (!item.cancel.requested) {
      return res.status(400).json({
        success: false,
        alert: "Cancel not requested for this item",
      });
    }

    if (item.cancel.approvedAt) {
      return res.status(400).json({
        success: false,
        alert: "Cancel already approved",
      });
    }

    if (item.fulfillmentStatus.status === "cancelled") {
      return res.status(400).json({
        success: false,
        alert: "Item already cancelled",
      });
    }

    /* =============================
       CALCULATIONS WITH ITEM-LEVEL COUPON
    ============================= */

    // Get item pricing details
    const itemPrice = item.offerPrice || item.price || 0;
    const itemQuantity = item.quantity || 1;
    const itemTaxAmount = item.accessoryTax || 0;
    const itemCouponDiscount = item.itemCouponDiscount || 0;

    // Calculate item's line total (price after offers, before coupon)
    const itemLineTotal = roundMoney(itemPrice * itemQuantity);

    // Calculate item's total after coupon (this is what should be refunded/adjusted)
    const itemPriceAfterCoupon = item.priceAfterCoupon || itemLineTotal;

    // Total amount for this item including tax
    const itemTotalAmount = roundMoney(itemPriceAfterCoupon + itemTaxAmount);

    // Calculate new order totals
    const newSubTotal = Math.max(0, order.subtotal - itemLineTotal);
    const newTaxAmount = Math.max(0, order.taxAmount - itemTaxAmount);
    const newCouponDiscount = Math.max(
      0,
      (order.couponDiscount || 0) - itemCouponDiscount,
    );
    const newTotalAmount = Math.max(0, order.totalAmount - itemTotalAmount);

    const currentPaidAmount = order.paidAmount || 0;
    let refundAmount = 0;
    let newRemainingAmount = 0;
    let newPaidAmount = currentPaidAmount;
    let newPaymentStatus = order.paymentStatus;

    const canRefund =
      order.paymentMethod === "STRIPE" ||
      order.paymentMethod === "WALLET" ||
      order.stripePaymentIntentId;

    /* REFUND LOGIC - Based on item's actual charged amount */
    if (
      order.paymentStatus === "Paid" ||
      currentPaidAmount >= order.totalAmount
    ) {
      if (canRefund) {
        // Refund the actual amount paid for this item (after coupon and with tax)
        refundAmount = itemTotalAmount;
        newPaidAmount = Math.max(0, currentPaidAmount - refundAmount);
      } else {
        refundAmount = 0;
      }

      newRemainingAmount = Math.max(0, newTotalAmount - newPaidAmount);

      if (newTotalAmount <= 0) {
        newPaymentStatus =
          canRefund && refundAmount > 0 ? "Refunded" : "Cancelled";
      } else if (newPaidAmount >= newTotalAmount) {
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else if (newPaidAmount > 0) {
        newPaymentStatus = "Partially Paid";
      } else {
        newPaymentStatus = "Pending";
      }
    } else if (order.paymentStatus === "Partially Paid") {
      refundAmount = 0;
      newRemainingAmount = Math.max(0, newTotalAmount - currentPaidAmount);

      if (newTotalAmount <= 0) {
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else if (currentPaidAmount >= newTotalAmount) {
        newPaymentStatus = "Paid";
        newRemainingAmount = 0;
      } else {
        newPaymentStatus = "Partially Paid";
      }
    } else {
      refundAmount = 0;
      newRemainingAmount = Math.max(0, newTotalAmount - currentPaidAmount);
      newPaymentStatus = order.paymentStatus;
    }

    /* =============================
       UPDATE ORDER
    ============================= */
    const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);

    order.items[itemIndex].cancel.approvedAt = new Date();
    order.items[itemIndex].cancel.refundAmount = refundAmount;
    order.items[itemIndex].fulfillmentStatus.status = "cancelled";

    // Update order-level totals
    order.subtotal = newSubTotal;
    order.taxAmount = newTaxAmount;
    order.couponDiscount = newCouponDiscount;
    order.totalAmount = newTotalAmount;
    order.remainingAmount = newRemainingAmount;
    order.paymentStatus = newPaymentStatus;

    if (refundAmount > 0 && canRefund) {
      order.paymentTransactions.push({
        paymentIntentId: `REFUND_${orderId}_${itemId}_${Date.now()}`,
        amount: refundAmount,
        status: "refunded",
        paymentMethod: order.paymentMethod,
        type: "refund",
        paidAt: new Date(),
      });

      order.totalRefundAmount = (order.totalRefundAmount || 0) + refundAmount;
      order.paidAmount = newPaidAmount;
    }

    await order.save();

    /* =============================
       STOCK UPDATE
    ============================= */
    if (item.variantId) {
      await CarVariant.findByIdAndUpdate(item.variantId, {
        $inc: { stock: item.quantity },
      });
    }

    if (item.accessoryId) {
      await Accessory.findByIdAndUpdate(item.accessoryId, {
        $inc: { stock: item.quantity },
      });
    }

    /* =============================
       WALLET REFUND - USING "cancel" TYPE
    ============================= */
    if (refundAmount > 0 && canRefund) {
      const wallet = await Wallet.findOne({ userId: order.userId });

      if (wallet) {
        wallet.balance += refundAmount;

        wallet.transactionHistory.push({
          amount: refundAmount,
          type: "cancel",
          flow: "credit",
          message: `Cancellation refund for order ${order.orderId} - ${item.productName} (₹${itemPriceAfterCoupon.toFixed(2)} + ₹${itemTaxAmount.toFixed(2)} tax)`,
          date: new Date(),
        });

        await wallet.save();
      }
    }

    /* =============================
       CHECK IF ALL ITEMS CANCELLED
    ============================= */
    const allItemsCancelled = order.items.every(
      (item) => item.fulfillmentStatus.status === "cancelled",
    );

    if (allItemsCancelled) {
      let finalPaymentStatus =
        order.totalRefundAmount > 0 ? "Refunded" : "Cancelled";

      await Order.updateOne(
        { _id: orderObjectId },
        {
          $set: {
            paymentStatus: finalPaymentStatus,
            remainingAmount: 0,
            totalAmount: 0,
            subtotal: 0,
            taxAmount: 0,
            couponDiscount: 0,
          },
        },
      );
    }

    /* =============================
       RESPONSE
    ============================= */
    let refundNote = "";
    if (refundAmount > 0 && canRefund) {
      refundNote = `Refund of ₹${refundAmount.toFixed(2)} issued to wallet (includes coupon discount of ₹${itemCouponDiscount.toFixed(2)})`;
    } else if (order.paymentStatus === "Partially Paid") {
      refundNote = `No refund - Advance payment (₹${order.advanceAmount}) is non-refundable. Remaining adjusted to ₹${newRemainingAmount.toFixed(2)}`;
    } else if (!canRefund) {
      refundNote = "No refund - COD order, no online payment made";
    } else {
      refundNote = "No refund - Payment not completed";
    }

    res.json({
      success: true,
      message: "Cancel approved successfully",
      refundNote: refundNote,
      details: {
        itemPrice: itemPrice,
        itemCouponDiscount: itemCouponDiscount,
        itemPriceAfterCoupon: itemPriceAfterCoupon,
        itemTax: itemTaxAmount,
        totalRefund: refundAmount,
      },
    });
  } catch (err) {
    console.error("Cancel approve error:", err);
    return res.status(500).json({
      success: false,
      alert: "Failed to process cancellation. Please try again.",
      error: err.message,
    });
  }
};

/* ================= HELPER FUNCTION ================= */
const roundMoney = (value) => Math.round(value * 100) / 100;

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

module.exports = { loadCancelReq, cancelApprove, cancelReject };
