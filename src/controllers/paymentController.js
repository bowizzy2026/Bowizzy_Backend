const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const UserPayment = require("../models/UserPayment");
const UserSubscription = require("../models/UserSubscription");



// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { amount, plan_type } = req.body;
    const user_id = req.user.user_id;

    // validate rupees
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Razorpay needs paise
    const paise = Math.round(Number(amount) * 100);

    const order = await razorpay.orders.create({
      amount: paise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    // ✅ STORE RUPEES IN DB
    await UserPayment.query().insert({
      user_id,
      razorpay_order_id: order.id,
      amount: Number(amount),   // ₹100 stays 100
      currency: "INR",
      status: "created",
      plan_type
    });

    return res.json(order);

  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Order creation failed" });
  }
};


// VERIFY PAYMENT + UPDATE SUBSCRIPTION
exports.verifyPayment = async (req, res) => {
  try {
    const {
      interview_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      await UserPayment.query()
        .patch({ status: "failed" })
        .where({ razorpay_order_id });

      return res.status(400).json({ message: "Payment verification failed" });
    }

    // ✅ ONLY UPDATE PAYMENT
    await UserPayment.query()
      .patch({
        status: "success",
        razorpay_payment_id,
        razorpay_signature
      })
      .where({ razorpay_order_id });
    
    return res.json({
      message: "Payment successful"
    });

  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ message: "Verification error" });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      await UserPayment.query()
        .patch({ status: "success" })
        .where({ razorpay_payment_id: payment.id });
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await UserPayment.query()
        .patch({ status: "failed" })
        .where({ razorpay_payment_id: payment.id });
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ message: "Webhook error" });
  }
};

