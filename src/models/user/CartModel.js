const mongoose = require("mongoose");
const { Schema } = mongoose;
const Car = require("../admin/productCarModal");
const CarVariant = require("../admin/carVariantModel");
const Accessory = require("../admin/productAccessoryModal");
const taxRate = parseInt(process.env.ACCESSORY_TAX_RATE);

const cartItemSchema = new Schema(
  {
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
      default: 1,
      min: 1,
      max: 5,
      set: (value) => Math.min(5, Math.max(1, value)),
    },
    lineTotal: { type: Number, default: 0 },
    price: { type: Number, required: true },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    discountedPrice: { type: Number },
    carTotal: { type: Number, default: 0 },
    accessoryTotal: { type: Number, default: 0 },
    accessoryTax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalAfterAll: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recalculate totalAmount before every save (keeps cart totals consistent)
cartSchema.pre("save", async function (next) {
  try {
    let carTotal = 0;
    let accessoryTotal = 0;

    for (const item of this.items) {
      // ACCESSORY PRICE
      if (item.accessoryId) {
        const accessory = await Accessory.findById(item.accessoryId).lean();
        if (accessory && accessory.isListed !== false) {
          accessoryTotal += (item.price || 0) * (item.quantity || 0);
          item.lineTotal = (item.price || 0) * (item.quantity || 0);
        }
      }

      // CAR PRICE (variant)
      if (item.variantId) {
        const variant = await CarVariant.findById(item.variantId).lean();
        if (variant && variant.isListed !== false) {
          carTotal += (item.price || 0) * (item.quantity || 0);
        }
      }
    }

    // SAVE base totals
    this.carTotal = carTotal;
    this.accessoryTotal = accessoryTotal;

    // CALCULATE TAX
    const accessoryTax = accessoryTotal * (taxRate / 100);
    this.accessoryTax = accessoryTax;

    // GRAND TOTAL (Car + Accessory + Tax)
    this.totalAmount = carTotal + accessoryTotal;
    this.totalAfterAll = carTotal + accessoryTotal + this.accessoryTax;

    next();
  } catch (err) {
    next(err);
  }
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
