const UserCredits = require("../models/UserCredits");
const User = require("../models/User");

exports.getUserCredits = async (req, res) => {
  try {
    const { user_id } = req.params;

    const credits = await UserCredits.query()
      .where("user_id", user_id)
      .first();

    if (!credits) {
      return res.status(404).json({ message: "User credits not found" });
    }

    const user = await User.query().findById(user_id);

    return res.json({
      credits,
      coupon_code: user ? user.coupon_code || null : null,
      count: user ? (user.count ?? null) : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user credits" });
  }
};

exports.getAllUsersCredits = async (req, res) => {
  try {
    if (req.user.user_type !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const list = await UserCredits.query()
      .select(
        "user_credits.id",
        "user_credits.user_id",
        "user_credits.credits",
        "user_credits.created_at",
        "user_credits.updated_at"
      )
      .orderBy('user_id', 'asc');

    return res.json(list);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user credits" });
  }
};

exports.addCredits = async (req, res) => {
  try {
    if (req.user.user_type !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { user_id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be greater than 0" });
    }

    let userCredits = await UserCredits.query()
      .where("user_id", user_id)
      .first();

    if (!userCredits) {
      userCredits = await UserCredits.query().insert({
        user_id,
        credits: amount
      });
      return res.status(201).json({
        message: "Credits added successfully",
        data: userCredits
      });
    }

    const updated = await UserCredits.query()
      .where("user_id", user_id)
      .increment("credits", amount)
      .returning("*");

    return res.json({
      message: "Credits added successfully",
      data: updated[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding credits" });
  }
};

exports.deductCredits = async (req, res) => {
  try {
    if (req.user.user_type !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { user_id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be greater than 0" });
    }

    const userCredits = await UserCredits.query()
      .where("user_id", user_id)
      .first();

    if (!userCredits) {
      return res.status(404).json({ message: "User credits not found" });
    }

    if (userCredits.credits < amount) {
      return res.status(400).json({
        message: "Insufficient credits",
        available: userCredits.credits,
        requested: amount
      });
    }

    const updated = await UserCredits.query()
      .where("user_id", user_id)
      .decrement("credits", amount)
      .returning("*");

    return res.json({
      message: "Credits deducted successfully",
      data: updated[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deducting credits" });
  }
};

exports.updateCredits = async (req, res) => {
  try {
    if (req.user.user_type !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { user_id } = req.params;
    const { credits } = req.body;

    if (credits === undefined || credits < 0) {
      return res.status(400).json({ message: "Invalid credits value" });
    }

    let userCredits = await UserCredits.query()
      .where("user_id", user_id)
      .first();

    if (!userCredits) {
      userCredits = await UserCredits.query().insert({
        user_id,
        credits
      });
      return res.status(201).json({
        message: "Credits updated successfully",
        data: userCredits
      });
    }

    const updated = await UserCredits.query()
      .where("user_id", user_id)
      .patch({ credits })
      .returning("*");

    return res.json({
      message: "Credits updated successfully",
      data: updated[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating credits" });
  }
};

exports.getCreditHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.query().findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const history = await UserCredits.query()
      .where("user_id", user_id)
      .orderBy("created_at", "desc");

    return res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching credit history" });
  }
};