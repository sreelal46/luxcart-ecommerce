const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactionHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: 1,
        },
        type: {
          type: String,
          enum: ["cancel", "return", "referral", "purchase", "add_to_wallet"],
          required: true,
        },
        flow: {
          type: String,
          enum: ["credit", "debit"], // credit = add, debit = minus
          required: true,
        },
        message: {
          type: String,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
