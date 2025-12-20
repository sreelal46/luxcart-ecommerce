const mongoose = require("mongoose");
const { Schema } = mongoose;

const offerSchema = new Schema(
  {
    discountType: {
      type: String,
      enum: ["Percentage", "Flat"],
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

const accessoryProductSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    brand_id: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    product_type_id: {
      type: Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },

    description: String,

    country_of_origin: String,
    fabric: String,
    finish: String,
    fitting: String,
    warranty: String,
    waterproof: Boolean,

    vehicle: String,
    production_year: String,

    price: { type: Number, required: true },

    //PRODUCT LEVEL OFFER
    productOffer: {
      type: offerSchema,
      default: null,
    },

    //CATEGORY LEVEL OFFER (copied from Category)
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
    material: { type: String, required: true },
    stock: { type: Number, required: true },
    images: [{ type: String }],

    isListed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Accessory = mongoose.model("Accessory", accessoryProductSchema);
module.exports = Accessory;
