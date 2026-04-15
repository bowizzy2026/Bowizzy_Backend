const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/adminController");

router.delete("/admin/users/:user_id", controller.deleteUserAndAssociations);

router.get(
  "/admin/interviewers",
  auth,
  controller.getInterviewerRequests
);

router.get(
  "/admin/approved-interviewers",
  auth,
  controller.approveInterviewer
);

router.get(
  "/admin/all-users",
  auth,
  controller.getAllUsers
);

router.get(
  "/admin/export-users",
  auth,
  controller.exportUsersToExcel
);

router.patch(
  "/admin/interviewers/:user_id/verify",
  auth,
  controller.verifyInterviewer
);

router.put(
  "/admin/users/:user_id",
  controller.updateUser
);

router.get(
  "/admin/user-plan-stats",
  auth,
  controller.getUserPlanStats
);

router.get(
  "/admin/interview-slot-stats",
  auth,
  controller.getInterviewSlots
);

router.get("/revenue", auth, controller.getTotalRevenue);
router.get("/user-payments", auth, controller.getUserWiseRevenue);

//pricing_routes
router.post("/admin/pricing", auth, controller.createPrice);
router.get("/admin/pricing", auth, controller.getPrices);
router.get("/admin/pricing/:id", auth, controller.getPriceById);
router.put("/admin/pricing/:id", auth, controller.updatePrice);
router.delete("/admin/pricing/:id", auth, controller.deletePrice);

router.post("/admin/plans", auth, controller.createPlan);
router.get("/admin/plans", auth, controller.getPlans);
router.put("/admin/plans/:id", auth, controller.updatePlan);
router.delete("/admin/plans/:id", auth, controller.deletePlan);
router.get("/admin/plans/:id", auth, controller.getPlanById);

router.get('/admin/users',auth, controller.getAllUsers);
router.get('/admin/all-users-with-bank-details', auth, controller.getAllUsersWithBankDetails);

router.get('/admin/accepted-interviews', auth, controller.getAcceptedInterviews);
module.exports = router;