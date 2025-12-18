const mongoose = require("mongoose");

const carVariantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    offer: {
      discountType: {
        type: String,
        enum: ["Percentage", "Price"],
        index: true,
      },
      discountValue: Number,

      validFrom: {
        type: Date,
        index: true,
      },
      validTo: {
        type: Date,
        index: true,
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    discountedPrice: { type: Number, default: null },
    color: { type: String, required: true },
    stock: { type: Number, default: 0 },
    image_url: [{ type: String }], // array of image URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarVariant", carVariantSchema);
