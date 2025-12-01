const mongoose = require("mongoose");
const Counter = require("./counterModel");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  carId: {
    type: Schema.Types.ObjectId,
    ref: "Car",
    default: null,
  },
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  totalItemAmount: {
    type: Number,
    required: true,
  },
  requestInfo: {
    requested: { type: Boolean, default: false },
    requestedType: {
      type: String,
      enum: ["none", "cancel", "return"],
      default: "none",
    },
    reason: { type: String, default: "" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "refunded"],
      default: "none",
    },
    requestedAt: Date,
    processedAt: Date,
  },
});

const addressSchema = new Schema({
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
});

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    address: addressSchema,

    paymentMethod: {
      type: String,
      enum: ["COD", "NETBANKING", "CARD", "UPI"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "advanced"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    subtotal: {
      type: Number,
      required: true,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    shippingCharges: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentId: {
      type: String,
      default: null,
    },

    trackingId: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

//Auto-generate orderId
orderSchema.pre("save", async function (next) {
  if (this.orderId) return next(); // Prevent regeneration on updates

  const counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.orderId = "LC-" + counter.value.toString().padStart(6, "0");

  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
