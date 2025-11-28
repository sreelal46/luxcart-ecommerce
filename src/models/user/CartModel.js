const mongoose = require("mongoose");
const { Schema } = mongoose;
const Car = require("../admin/productCarModal");
const CarVariant = require("../admin/carVariantModel");
const Accessory = require("../admin/productAccessoryModal");

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
    quantity: { type: Number, default: 1 },
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
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recalculate totalAmount before every save (keeps cart totals consistent)
// cartSchema.pre("save", async function (next) {
//   try {
//     let total = 0;

//     for (const item of this.items) {
//       let product = null;

//       if (item.carId) {
//         product = await Car.findById(item.carId).lean();
//       } else if (item.variantId) {
//         product = await CarVariant.findById(item.variantId).lean();
//       } else if (item.accessoryId) {
//         product = await Accessory.findById(item.accessoryId).lean();
//       }

//       // Skip if product not found or unlisted
//       if (!product || product.isListed === false) continue;

//       total += (item.price || 0) * (item.quantity || 0);
//     }

//     this.totalAmount = total;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
