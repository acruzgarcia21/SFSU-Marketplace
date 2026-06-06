const pool = require("../db/pool");

// GET /api/messages
const getAllChats = async (req, res) => {
  // hardcoded current user for now
  const currentUserId = req.user.id;

  if (!currentUserId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        c.conversation_id AS chatId,
        c.listing_id,
        l.title AS listing_title,
        u.user_id AS other_user_id,
        u.display_name AS other_user_name,
        (
          SELECT m.body
          FROM Message m
          WHERE m.conversation_id = c.conversation_id
          ORDER BY m.sent_at DESC
          LIMIT 1
        ) AS latest_message,
        (
          SELECT m.sent_at
          FROM Message m
          WHERE m.conversation_id = c.conversation_id
          ORDER BY m.sent_at DESC
          LIMIT 1
        ) AS latest_message_time
      FROM Conversation c
      JOIN Conversation_Participant cp_self
        ON c.conversation_id = cp_self.conversation_id
      JOIN Conversation_Participant cp_other
        ON c.conversation_id = cp_other.conversation_id
      JOIN User u
        ON cp_other.user_id = u.user_id
      LEFT JOIN Listing l
        ON c.listing_id = l.listing_id
      WHERE cp_self.user_id = ?
        AND cp_other.user_id <> ?
      ORDER BY c.created_at DESC
      `,
      [currentUserId, currentUserId],
    );

    res.json({ chats: rows });
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/messages/:chatId
const getMessagesByChatId = async (req, res) => {
  const currentUserId = req.user.id;
  const { chatId } = req.params;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Make sure logged-in user belongs to this conversation
    const [participantRows] = await pool.execute(
      `
      SELECT conversation_id
      FROM Conversation_Participant
      WHERE conversation_id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [chatId, currentUserId],
    );

    if (participantRows.length === 0) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        m.message_id,
        m.sender_id,
        m.body,
        m.sent_at,
        u.display_name
      FROM Message m
      JOIN User u
        ON m.sender_id = u.user_id
      WHERE m.conversation_id = ?
      ORDER BY m.sent_at ASC
      `,
      [chatId],
    );

    return res.json({ messages: rows });
  } catch (err) {
    console.error("Get messages by chatId error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/messages
const createMessage = async (req, res) => {
  const sender = req.user.id; // session user, NOT req.body.sender
  const { receiver, listing_id, body } = req.body;

  if (!sender) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!receiver || !listing_id || !body || !body.trim()) {
    return res.status(400).json({
      error: "receiver, listing_id, and body are required",
    });
  }

  if (Number(sender) === Number(receiver)) {
    return res.status(400).json({
      error: "You cannot message yourself",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Optional but recommended: verify receiver exists
    const [receiverRows] = await connection.execute(
      `
      SELECT user_id
      FROM User
      WHERE user_id = ?
      LIMIT 1
      `,
      [receiver],
    );

    if (receiverRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Receiver not found" });
    }

    // Optional but recommended: verify listing exists
    const [listingRows] = await connection.execute(
      `
      SELECT listing_id
      FROM Listing
      WHERE listing_id = ?
      LIMIT 1
      `,
      [listing_id],
    );

    if (listingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Listing not found" });
    }

    const [existingRows] = await connection.execute(
      `
      SELECT c.conversation_id
      FROM Conversation c
      JOIN Conversation_Participant cp1
        ON c.conversation_id = cp1.conversation_id
      JOIN Conversation_Participant cp2
        ON c.conversation_id = cp2.conversation_id
      WHERE c.listing_id = ?
        AND cp1.user_id = ?
        AND cp2.user_id = ?
      LIMIT 1
      `,
      [listing_id, sender, receiver],
    );

    let chatId;

    if (existingRows.length > 0) {
      chatId = existingRows[0].conversation_id;
    } else {
      const [conversationResult] = await connection.execute(
        `
        INSERT INTO Conversation (listing_id, conversation_type)
        VALUES (?, 'direct')
        `,
        [listing_id],
      );

      chatId = conversationResult.insertId;

      await connection.execute(
        `
        INSERT INTO Conversation_Participant (conversation_id, user_id)
        VALUES (?, ?), (?, ?)
        `,
        [chatId, sender, chatId, receiver],
      );
    }

    const [messageResult] = await connection.execute(
      `
      INSERT INTO Message (conversation_id, sender_id, body)
      VALUES (?, ?, ?)
      `,
      [chatId, sender, body.trim()],
    );

    await connection.commit();

    return res.status(201).json({
      ok: true,
      chatId,
      message_id: messageResult.insertId,
      sender,
      receiver,
      listing_id,
      body: body.trim(),
    });
  } catch (err) {
    await connection.rollback();
    console.error("Create message error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllChats,
  getMessagesByChatId,
  createMessage,
};
