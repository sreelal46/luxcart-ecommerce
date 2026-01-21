const { OK } = require("../../constant/statusCode");
const Wallet = require("../../models/user/walletsModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const loadwalletPage = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const wallet = await Wallet.findOne({ userId });
    res
      .status(OK)
      .render("user/account/wallet", { layout: "userAccountLayout", wallet });
  } catch (error) {
    console.log("Error from wallet page load", error);
    next(error);
  }
};

// Add money to wallet - Create Payment Intent
const addMoneyToWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.session.user._id;

    // Validation
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least ₹1",
      });
    }

    // Convert to paise (Stripe uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        userId: userId.toString(),
        type: "wallet_recharge",
        amount: amount,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
    });
  } catch (error) {
    console.error("Add money to wallet error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
};

// Verify payment and update wallet balance
const verifyWalletPayment = async (req, res, next) => {
  try {
    const { payment_intent } = req.body;
    const userId = req.session.user._id;

    if (!payment_intent) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

    // Verify payment status
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Verify user ID matches
    if (paymentIntent.metadata.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized payment verification",
      });
    }

    const amount = parseFloat(paymentIntent.metadata.amount);

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      // Create new wallet if doesn't exist
      wallet = new Wallet({
        userId,
        balance: 0,
        transactionHistory: [],
      });
    }

    // Update balance
    wallet.balance += amount;

    // Add transaction to history (matching your schema)
    wallet.transactionHistory.push({
      amount: amount,
      type: "add_to_wallet", // ✅ Using your enum value
      flow: "credit", // ✅ Money coming in
      message: "Money added to wallet via Stripe",
      date: new Date(),
    });

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Money added successfully",
      balance: wallet.balance,
      redirect: "/account/wallet",
    });
  } catch (error) {
    console.error("Verify wallet payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

module.exports = {
  addMoneyToWallet,
  verifyWalletPayment,
  loadwalletPage,
};
