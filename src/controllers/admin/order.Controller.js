const { OK, BAD_REQUEST, NOT_FOUND } = require("../../constant/statusCode");
const Order = require("../../models/user/OrderModel");
const Return = require("../../models/user/ReturnModel");

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

    // Update ALL items
    order.items.forEach((item) => {
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

    const result = await Order.updateOne(
      {
        _id: orderId,
        "items._id": itemId,
        "items.cancel.requested": true,
      },
      {
        $set: {
          "items.$.cancel.approvedAt": new Date(),
          "items.$.fulfillmentStatus.status": "cancelled",
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
    const { returnId } = req.params;

    await Return.findByIdAndUpdate(returnId, {
      status: "approved",
    });

    res.status(OK).json({ success: true });
  } catch (error) {
    console.log("Error from return approve", error);

    next(error);
  }
};
const returnReject = async (req, res, next) => {
  try {
    const { returnId } = req.params;

    await Return.findByIdAndUpdate(returnId, {
      status: "rejected",
    });

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
