const Cart = require("../../models/user/CartModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const payment = async (req, res, next) => {
  try {
    const { amount } = req.body; // amount in INR
    const userId = req.session.user._id;
    const paymentMethod = req.params.paymentMethod;
    req.session.paymentMethod = paymentMethod;
    const cart = await Cart.findOne({ userId });

    if (!paymentMethod)
      return res.status(FORBIDDEN).json({ succes: false, redirect: "/cart" });
    if (!cart.items.length)
      return res.status(FORBIDDEN).json({ succes: false, redirect: "/cart" });

    await cart.save();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert to paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      description: "LuxCart - Luxury Car Purchase",
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
    next(err);
  }
};

module.exports = { payment };
