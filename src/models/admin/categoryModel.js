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
      type: String,
    },
    isListed: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
