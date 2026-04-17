const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/interviewSlotController");


router.post("/users/:user_id/mock-interview/interview-slot", auth, controller.create);
router.put("/users/:user_id/mock-interview/interview-slot/confirm-payment/:slot_id", auth, controller.updatePaymentInfo);
router.get("/users/mock-interview/interview-slot", auth, controller.getAll);
router.get("/users/:user_id/mock-interview/interview-slot", auth, controller.getByUser);
router.get("/users/:user_id/mock-interview/interview-slot/:id", auth, controller.getById);
router.put("/users/:user_id/mock-interview/interview-slot/:id", auth, controller.cancel);

router.get("/users/:user_id/mock-interview/is-interviewer", auth, controller.isInterviewer);

router.get("/users/:user_id/create-meet", auth, controller.createMeet)

module.exports = router;