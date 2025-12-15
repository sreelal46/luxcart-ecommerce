const mongoose = require("mongoose");
const { Schema } = mongoose;

const returnSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderedId: { type: String },
    orderItemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: String,
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "pickup_scheduled",
        "picked_up",
        "received",
        "refunded",
      ],
      default: "requested",
    },

    refundAmount: { type: Number, default: null },
    refundMethod: { type: String, default: null },

    adminNotes: { type: String, default: null },
  },
  { timestamps: true }
);

const Return = mongoose.model("Return", returnSchema);
module.exports = Return;
