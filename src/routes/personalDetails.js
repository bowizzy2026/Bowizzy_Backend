const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const upload = require("../utils/multer");
const controller = require("../controllers/personalDetailsController");

router.post(
  "/users/:user_id/personal-details",
  upload.single("photo"),
  auth,
  controller.create
);

router.get(
  "/users/:user_id/personal-details",
  auth,
  controller.getByUser
);

router.get(
  "/users/:user_id/personal-details/:id",
  auth,
  controller.getById
);

router.put(
  "/users/:user_id/personal-details/:id",
  upload.single("photo"),
  auth,
  controller.update
);

router.get("/personal-details", controller.getAll);

router.delete(
  "/users/:user_id/personal-details/:id",
  auth,
  controller.remove
);

router.post(
  "/personal-details/send-otp",
  auth,
  controller.sendOTP
);

router.post(
  "/personal-details/verify-otp",
  auth,
  controller.verifyOTP
);

router.post(
  "/personal-details/update-with-otp",
  auth,
  controller.updatePersonalDetailsWithOTP
);

module.exports = router;
