const express = require("express");

const {
  getAllChats,
  getMessagesByChatId,
  createMessage,
} = require("../controllers/messageController");

const router = express.Router();
const requireAuth = require("../middleware/auth");

// messaging routes
router.get("/", requireAuth, getAllChats);
router.get("/:chatId", requireAuth, getMessagesByChatId);
router.post("/", requireAuth, createMessage);

module.exports = router;
