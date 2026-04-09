const AiSession = require("../models/AiSession");
const AiChat = require("../models/AiChat");

// Create a new AI session
exports.createSession = async (req, res) => {
  try {
    const { session_name, mode } = req.body;

    // Validation
    if (!session_name) {
      return res.status(400).json({ message: "Session name is required" });
    }

    if (!mode || !["jd", "non-jd"].includes(mode)) {
      return res.status(400).json({ message: "Mode must be 'jd' or 'non-jd'" });
    }

    const session = await AiSession.query().insert({
      session_name,
      mode
    });

    return res.status(201).json({
      message: "AI session created successfully",
      data: session
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating AI session" });
  }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await AiSession.query()
      .findById(session_id)
      .withGraphFetched("chats");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching session" });
  }
};

// Get all sessions
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await AiSession.query().withGraphFetched("chats");

    return res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching sessions" });
  }
};

// Update session
exports.updateSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { session_name, mode } = req.body;

    const session = await AiSession.query().findById(session_id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const updatedSession = await AiSession.query()
      .findById(session_id)
      .patch({
        session_name: session_name || session.session_name,
        mode: mode || session.mode
      });

    return res.json({
      message: "Session updated successfully",
      data: updatedSession
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating session" });
  }
};

// Delete session
exports.deleteSession = async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await AiSession.query().findById(session_id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await AiSession.query().deleteById(session_id);

    return res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting session" });
  }
};
