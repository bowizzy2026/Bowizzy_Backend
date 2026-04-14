const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/interviewerReviewController");


router.post("/users/:user_id/mock-interview/candidate-review", auth, controller.create);
router.get("/users/:user_id/mock-interview/interviewer-review", auth, controller.getByUser);
router.get("/users/:user_id/mock-interview/interviewer-review/:id", auth, controller.getById);
router.get("/users/:user_id/mock-interview/bank-details", auth, controller.userHasBankDetails);




module.exports = router;