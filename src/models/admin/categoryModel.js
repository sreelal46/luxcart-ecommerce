const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    product: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
        default: false,
        index: true,
      },
      isConfigured: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    discountedPrice: { type: Number, default: null },
    isListed: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
