const { OK, BAD_REQUEST, NOT_FOUND } = require("../../constant/statusCode");
const carVariant = require("../../models/admin/carVariantModel");
const Accessory = require("../../models/admin/productAccessoryModal");
const Order = require("../../models/user/OrderModel");
const Return = require("../../models/user/ReturnModel");
const mongoose = require("mongoose");

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, target } = req.body;
    console.log("Target", target);

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
    console.log("Order id", orderId);
    console.log("item id", itemId);
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
      }
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
      }
    );

    if (!order) {
      return res.status(400).json({
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

    /* =============================
       CALCULATIONS
    ============================= */
    const itemAdvanceAmount = item.advanceAmount || 0;
    const itemTaxAmount = item.accessoryTax || 0;
    const itemPrice = item.price || 0;
    const paymentMethod = order.paymentMethod === "COD";
    const itemTotalAmount = item.totalItemAmount || 0;

    const newSubTotal = order.subtotal - itemPrice;
    const newTaxAmount = order.taxAmount - itemTaxAmount;
    const newTotalAmount = newSubTotal + newTaxAmount;
    const newAdvanceAmount = order.advanceAmount - itemAdvanceAmount;
    const newRemainingAmount = newTotalAmount - newAdvanceAmount;
    console.log(
      "==================================itemAdvanceAmount================="
    );
    console.log(itemAdvanceAmount);
    console.log(
      "==================================itemTaxAmount================="
    );
    console.log(itemTaxAmount);
    console.log(
      "==================================paymentMethod================="
    );
    console.log(paymentMethod);
    console.log(
      "==================================newSubTotal================="
    );
    console.log(newSubTotal);
    console.log(
      "==================================newTaxAmount================="
    );
    console.log(newTaxAmount);
    console.log(
      "==================================newAdvanceAmount================="
    );
    console.log(newAdvanceAmount);
    console.log(
      "==================================newTaxAmount================="
    );
    console.log(newTaxAmount);
    console.log(
      "==================================newRemainingAmount================="
    );
    console.log(newRemainingAmount);
    /* =============================
       ATOMIC UPDATE
    ============================= */
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
      {
        $set: {
          "items.$.cancel.approvedAt": new Date(),
          "items.$.cancel.refundAmount": paymentMethod
            ? itemAdvanceAmount
            : itemTotalAmount,
          "items.$.fulfillmentStatus.status": "cancelled",
          advanceAmount: newAdvanceAmount > 0 ? newAdvanceAmount : 0,
          remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0,
          totalAmount: newTotalAmount > 0 ? newTotalAmount : 0,
          subtotal: newSubTotal > 0 ? newSubTotal : 0,
          taxAmount: newTaxAmount > 0 ? newTaxAmount : 0,
        },
        $inc: {
          totalRefundAmount: paymentMethod
            ? itemAdvanceAmount
            : itemTotalAmount,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
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
        { $inc: { stock: quantity } }
      );
    }
    if (accessoryId) {
      await Accessory.findByIdAndUpdate(
        { _id: accessoryId },
        { $inc: { stock: quantity } }
      );
    }
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
      }
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
      }
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
    console.log("================================== RETURN =================");
    console.log(
      "==================================itemAdvanceAmount================="
    );
    console.log(itemAdvanceAmount);
    console.log(
      "==================================itemTaxAmount================="
    );
    console.log(itemTaxAmount);
    console.log(
      "==================================newSubTotal================="
    );
    console.log(newSubTotal);
    console.log(
      "==================================newTaxAmount================="
    );
    console.log(newTaxAmount);
    console.log(
      "==================================newAdvanceAmount================="
    );
    console.log(newAdvanceAmount);
    console.log(
      "==================================newTaxAmount================="
    );
    console.log(newTaxAmount);
    console.log(
      "==================================newRemainingAmount================="
    );
    console.log(newRemainingAmount);
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
      }
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
        { $inc: { stock: quantity } }
      );
    }
    if (accessoryId) {
      await Accessory.findByIdAndUpdate(
        { _id: accessoryId },
        { $inc: { stock: quantity } }
      );
    }

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
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Return request not found or already processed",
      });
    }

    res.json({ success: true });
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
