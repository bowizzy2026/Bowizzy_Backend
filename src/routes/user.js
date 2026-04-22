const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/userController");

router.get("/users/:user_id", auth, controller.getUserById);
router.post("/users/:user_id/claim-welcome-bonus", auth, controller.claimWelcomeCredit);

module.exports = router;
