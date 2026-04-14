const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/interviewScheduleController");

// API for getting user verification status
router.get("/users/:user_id/mock-interview/interview-schedule/user-verification", auth, controller.getUserVerificationStatus);


// API to get the count of completed interviews
router.get("/users/:user_id/mock-interview/interview-schedule/count-completed-interviews", auth, controller.getCount);

// API to get the next upcoming interview
router.get("/users/:user_id/mock-interview/interview-schedule/next-interviews", auth, controller.getNextInterview);


// API related to saving interview slot
router.post("/users/:user_id/mock-interview/interview-schedule/save-interview-slot", auth, controller.saveSlot);
router.delete("/users/:user_id/mock-interview/interview-schedule/remove-interview-slot/:saved_slot_id", auth, controller.removeSavedSlot);
router.get("/users/:user_id/mock-interview/interview-schedule/saved-interview-slots", auth, controller.getSavedSlotsByUser);
// router.get("/users/:user_id/mock-interview/interview-schedule/saved-interview-slot/:saved_slot_id", auth, controller.getSavedSlotById);
router.get(
  "/mock-interview/interview-slot/:interview_slot_id",
  auth,
  controller.getInterviewSlotById
);


// Interview scheduling related APIs
router.post("/users/:user_id/mock-interview/interview-schedule", auth, controller.create);
router.get("/users/mock-interview/interview-schedule", auth, controller.getAll);
router.get("/users/mock-interview/interview-slots", auth, controller.getInterviewSlots);
router.get("/users/:user_id/mock-interview/interview-schedule", auth, controller.getByUser);
router.get("/users/:user_id/mock-interview/candidate-schedules", auth, controller.getCandidateSchedules);
router.get("/users/:user_id/mock-interview/interview-schedule/:interview_schedule_id/with-candidate-details", auth, controller.getScheduleWithCandidateDetails);
router.get("/users/:user_id/mock-interview/interview-schedule/:id", auth, controller.getById);
router.put("/users/:user_id/mock-interview/interview-schedule/:id", auth, controller.cancel);


// Bank account info related APIs used while user verification
router.post("/users/:user_id/verification/bank-details", auth, controller.createBankAccountInfo);
router.get("/users/:user_id/verification/bank-details", auth, controller.getAllBankInfoByUser);
router.get("/users/:user_id/verification/bank-details/:bank_id", auth, controller.getBankAccountDetails);
router.put("/users/:user_id/verification/bank-details/:bank_id", auth, controller.updateBankAccountDetails);
router.delete("/users/:user_id/verification/bank-details/:bank_id", auth, controller.deleteBankAccountDetails);

// API to update the interview schedule status and slot status as completed
router.put("/interview-schedules/:interview_schedule_id/status", auth, controller.updateInterviewAsCompleted);



module.exports = router;
