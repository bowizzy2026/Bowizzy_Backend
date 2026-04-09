const AiChat = require("../models/AiChat");
const AiSession = require("../models/AiSession");

// Create a new chat message
exports.createChat = async (req, res) => {
  try {
    const { session_id, text, file_link, type } = req.body;

    // Validation
    if (!session_id) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    if (!text) {
      return res.status(400).json({ message: "Chat text is required" });
    }

    if (!type || !["assistant", "user"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'assistant' or 'user'" });
    }

    // Check if session exists
    const session = await AiSession.query().findById(session_id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const chat = await AiChat.query().insert({
      session_id,
      text,
      file_link: file_link || null,
      type
    });

    return res.status(201).json({
      message: "Chat created successfully",
      data: chat
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating chat" });
  }
};

// Get all chats for a session
exports.getAllChats = async (req, res) => {
  try {
    const { session_id } = req.params;

    // Check if session exists
    const session = await AiSession.query().findById(session_id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const chats = await AiChat.query()
      .where("session_id", session_id)
      .orderBy("created_at", "asc");

    return res.json({
      message: "Chats retrieved successfully",
      data: chats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching chats" });
  }
};

// Start a chat session
exports.startChat = async (req, res) => {
  try {
    const { session_id } = req.params;

    // Check if session exists
    const session = await AiSession.query().findById(session_id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Update session to mark as started
    const updatedSession = await AiSession.query()
      .findById(session_id)
      .patch({ started: true });

    // Create an initial assistant greeting message
    const initialChat = await AiChat.query().insert({
      session_id,
      text: "Hi, I need to build my resume.",
      file_link: null,
      type: "user"
    });

    return res.json({
      message: "Chat session started successfully",
      data: {
        session: updatedSession,
        initialMessage: initialChat
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting chat session" });
  }
};
