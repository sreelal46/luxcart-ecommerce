const Wallet = require("../../models/user/walletsModel");

const updateWallet = async ({ userId, amount, type, flow, message }) => {
  if (!["credit", "debit"].includes(flow)) {
    throw new Error("Invalid wallet flow");
  }

  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const signedAmount = flow === "credit" ? amount : -amount;

  const wallet = await Wallet.findOneAndUpdate(
    {
      userId,
      ...(flow === "debit" && { balance: { $gte: amount } }),
    },
    {
      $inc: { balance: signedAmount },
      $push: {
        transactionHistory: { amount, type, flow, message },
      },
    },
    {
      new: true,
      upsert: flow === "credit",
    }
  );

  if (!wallet) {
    throw new Error("Insufficient wallet balance");
  }

  return wallet;
};

module.exports = updateWallet;
