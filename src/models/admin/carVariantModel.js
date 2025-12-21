const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    discountType: {
      type: String,
      enum: ["Percentage", "Price"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    validFrom: {
      type: Date,
      required: true,
      index: true,
    },
    validTo: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isConfigured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { _id: false }
);

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
    //PRODUCT LEVEL OFFER
    productOffer: {
      type: offerSchema,
      default: null,
    },

    //CATEGORY LEVEL OFFER
    categoryOffer: {
      type: offerSchema,
      default: null,
    },
    offerPrices: {
      productPrice: { type: Number, default: null },
      categoryPrice: { type: Number, default: null },
      finalPrice: { type: Number, default: null },
    },
    appliedOffer: {
      source: {
        type: String, // "PRODUCT" | "CATEGORY"
      },
      discountType: {
        type: String, // "Percentage" | "Price"
      },
      discountValue: Number,
    },

    color: { type: String, required: true },
    stock: { type: Number, default: 0 },
    image_url: [{ type: String }], // array of image URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarVariant", carVariantSchema);
