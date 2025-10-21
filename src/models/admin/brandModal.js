const mongoose = require("mongoose");

const brandSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    image_url: { type: String, required: true },
    isListed: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
