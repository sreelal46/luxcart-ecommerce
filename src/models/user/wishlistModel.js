const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistItemSchema = new Schema(
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
  },
  { _id: true, timestamps: true }
);

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;
