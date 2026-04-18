const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/aiSessionController");

// Create a new session
router.post("/sessions", auth, controller.createSession);

// Get all sessions
router.get("/sessions", auth, controller.getAllSessions);

// Get sessions by user ID
router.get("/user/sessions", auth, controller.getSessionsByUser);

// Get session by ID
router.get("/sessions/:session_id", auth, controller.getSessionById);

// Update session
router.put("/sessions/:session_id", auth, controller.updateSession);

// Delete session
router.delete("/sessions/:session_id", auth, controller.deleteSession);

module.exports = router;
