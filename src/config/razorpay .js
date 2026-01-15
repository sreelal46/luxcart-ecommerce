const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert to paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      description: "LuxCart - Luxury Car Purchase",
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
