const mongoose = require("mongoose");

const { Schema } = mongoose;

const accessoryProductSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    product_type_id: {
      type: Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
    description: { type: String },

    // Specification fields
    country_of_origin: { type: String },
    fabric: { type: String },
    finish: { type: String },
    fitting: { type: String },
    warranty: { type: String },
    waterproof: { type: Boolean },

    // Vehicle compatibility
    vehicle: { type: String },
    production_year: { type: String },
    price: { type: Number, required: true },
    material: { type: String, required: true },
    stock: { type: Number, required: true },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    isListed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Accessory = mongoose.model("Accessory", accessoryProductSchema);

module.exports = Accessory;
