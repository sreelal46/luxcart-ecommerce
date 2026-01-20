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

    /* PRICING */
    price: { type: Number, required: true },
    offerPrice: { type: Number, default: null },
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
  { timestamps: true },
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
  { _id: false },
);

/* =========================
   PAYMENT TRANSACTION SCHEMA
   ========================= */
const paymentTransactionSchema = new Schema(
  {
    paymentIntentId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "STRIPE", "CARD", "NETBANKING"],
    },
    type: {
      type: String,
      enum: ["advance", "full", "remaining"],
      required: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
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
      enum: ["COD", "STRIPE", "CARD", "NETBANKING", "WALLET"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Partially Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Stripe payment details (keep for backward compatibility)
    stripePaymentIntentId: {
      type: String,
      default: null,
    },

    stripePaymentStatus: {
      type: String,
      default: null,
    },

    /* PAYMENT TRANSACTIONS - NEW */
    paymentTransactions: [paymentTransactionSchema],

    /* AMOUNTS */
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    appliedCoupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
      code: { type: String, default: null },
      discountType: { type: String, default: null },
      discountValue: { type: Number, default: null },
      couponDiscount: { type: Number, default: 0 },
    },
    shippingCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    /* PAYMENT TRACKING - UPDATED */
    // Expected advance payment (what customer should pay initially)
    advanceAmount: { type: Number, default: 0 },

    // Actual amount paid so far (sum of all successful payments)
    paidAmount: { type: Number, default: 0 },

    // Amount still owed (calculated: totalAmount - paidAmount)
    remainingAmount: {
      type: Number,
      default: function () {
        return this.totalAmount - (this.paidAmount || 0);
      },
    },

    totalRefundAmount: { type: Number, default: 0 },
    trackingId: { type: String, default: null },

    /* INTERNAL NOTES */
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

/* =========================
   AUTO ORDER ID GENERATION
   ========================= */
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "order" },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    );

    this.orderId = "LC-" + counter.value.toString().padStart(6, "0");
  }

  // Calculate remaining amount before saving
  if (this.isModified("paidAmount") || this.isModified("totalAmount")) {
    this.remainingAmount = this.totalAmount - (this.paidAmount || 0);

    // Update payment status based on amounts
    if (this.paidAmount <= 0) {
      this.paymentStatus = "Pending";
    } else if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = "Paid";
      this.remainingAmount = 0; // Ensure no negative remaining
    } else {
      this.paymentStatus = "Partially Paid";
    }
  }

  next();
});

/* =========================
   VIRTUAL - IS FULLY PAID
   ========================= */
orderSchema.virtual("isFullyPaid").get(function () {
  return this.paidAmount >= this.totalAmount;
});

/* =========================
   METHOD - ADD PAYMENT
   ========================= */
orderSchema.methods.addPayment = function (paymentData) {
  // Add transaction to history
  this.paymentTransactions.push(paymentData);

  // Update paid amount if payment succeeded
  if (paymentData.status === "succeeded") {
    this.paidAmount = (this.paidAmount || 0) + paymentData.amount;

    // Update Stripe payment intent ID (for latest payment)
    if (paymentData.paymentMethod === "STRIPE") {
      this.stripePaymentIntentId = paymentData.paymentIntentId;
      this.stripePaymentStatus = "succeeded";
    }
  }

  return this;
};

module.exports = mongoose.model("Order", orderSchema);
