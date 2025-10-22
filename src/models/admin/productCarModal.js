const mongoose = require("mongoose");
const { Schema } = mongoose;

const carSchema = new Schema(
  {
    name: { type: String, required: true },
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
    price: { type: Number, required: true },
    offer_price: { type: Number, default: null },
    description: { type: String },
    isListed: { type: Boolean, default: true },

    // Specifications
    year: { type: Number },
    mileage: { type: String },
    warranty: { type: String },
    region: { type: String },
    top_speed: { type: Number },
    power_hp: { type: Number },
    engine: { type: String },
    transmission: { type: String },
    drive_type: { type: String },
    torque: { type: String },
    acceleration_0_100: { type: String },

    interiorAndExteriorColor: { type: String },
    wheels: { type: String },
    upholstery: { type: String },
    design: { type: String },

    cameras: { type: String },
    lane_assist: { type: Boolean, default: false },
    sound_system: { type: String },
    keyless_go: { type: Boolean, default: false },

    // Variants
    variantIds: [{ type: Schema.Types.ObjectId, ref: "CarVariant" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
