const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/aiChatController");

// Create a new chat message
router.post("/chats", auth, controller.createChat);

// Get all chats for a session
router.get("/sessions/:session_id/chats", auth, controller.getAllChats);

// Start a chat session
router.post("/sessions/:session_id/start", auth, controller.startChat);

module.exports = router;
