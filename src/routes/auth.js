const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");

router.post("/", controller.authHandler);

router.post("/check-coupon", controller.checkCouponCode);
router.post("/admin-login", controller.adminLogin);
module.exports = router;
