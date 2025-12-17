const mongoose = require("mongoose");
const Counter = require("./counterModel");
const { Schema } = mongoose;

/* =========================
   ORDER ITEM (ITEM LEVEL)
   ========================= */
const orderItemSchema = new Schema(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", default: null },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "CarVariant",
      default: null,
    },
    accessoryId: {
      type: Schema.Types.ObjectId,
      ref: "Accessory",
      default: null,
    },
    productName: { type: String, required: true },

    /* SNAPSHOT (NEVER CHANGE AFTER ORDER) */
    // name: { type: String, required: true },
    // variantName: { type: String, default: null },
    // image: { type: String, required: true },
    // sku: { type: String, default: null },

    /* PRICING */
    price: { type: Number, required: true },
    accessoryTax: { type: Number, default: null },
    quantity: { type: Number, required: true, min: 1 },
    advanceAmount: { type: Number, default: null },
    totalItemAmount: { type: Number, required: true },

    /* DELIVERY / FULFILLMENT STATUS (ADMIN CONTROLS THIS) */
    fulfillmentStatus: {
      status: {
        type: String,
        enum: [
          "placed",
          "confirmed",
          "shipped",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "returned",
        ],
        default: "placed",
      },
      placedAt: { type: Date, default: Date.now },
      confirmedAt: { type: Date, default: null },
      shippedAt: { type: Date, default: null },
      out_for_deliveryAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },

    /* CANCEL (BEFORE DELIVERY) */
    cancel: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: null },
      description: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      refundAmount: { type: Number, default: null },
    },

    /* RETURN (AFTER DELIVERY) */
    return: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: null },
      description: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      pickedUpAt: { type: Date, default: null },
      refundedAt: { type: Date, default: null },
      refundAmount: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

/* =========================
   ADDRESS
   ========================= */
const addressSchema = new Schema(
  {
    name: String,
    phone: String,
    email: String,
    label: String,
    street: String,
    landmark: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

/* =========================
   ORDER (ORDER LEVEL)
   ========================= */
const orderSchema = new Schema(
  {
    /* ORDER IDENTIFIER */
    orderId: {
      type: String,
      unique: true,
      index: true,
    },

    /* USER */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ITEMS */
    items: [orderItemSchema],

    /* SHIPPING ADDRESS */
    address: addressSchema,

    /* PAYMENT (ORDER LEVEL ONLY) */
    paymentMethod: {
      type: String,
      enum: ["COD", "NETBANKING", "CARD", "UPI"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending", // COD / not yet paid
        "advanced",
        "paid", // fully paid
        "failed",
        "partially_refunded", // some items refunded
        "refunded", // all items refunded
      ],
      default: "pending",
    },

    paymentId: {
      type: String,
      default: null,
    },

    /* AMOUNTS */
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    advanceAmount: { type: Number, default: null },
    remainingAmount: { type: Number, default: null },
    totalRefundAmount: { type: Number, default: 0 },
    trackingId: { type: String, default: null },

    /* INTERNAL NOTES */
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

/* =========================
   AUTO ORDER ID GENERATION
   ========================= */
orderSchema.pre("save", async function (next) {
  if (this.orderId) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.orderId = "LC-" + counter.value.toString().padStart(6, "0");
  next();
});

module.exports = mongoose.model("Order", orderSchema);
