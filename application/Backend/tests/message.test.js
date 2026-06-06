const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { resetTestDb } = require("./testDb");

describe("Message API", () => {
  let agent;

  beforeEach(async () => {
    await resetTestDb();

    agent = request.agent(app);

    await agent.post("/api/user/login").send({
      sfsu_email: "acruz@sfsu.edu",
      password: "pw1",
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/messages", () => {
    it("should return chats for the logged-in user", async () => {
      const res = await agent.get("/api/messages");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.chats)).toBe(true);

      res.body.chats.forEach((chat) => {
        expect(chat).toHaveProperty("chatId");
        expect(chat).toHaveProperty("other_user_name");
        expect(chat).toHaveProperty("latest_message");
      });
    });

    it("should reject unauthenticated users", async () => {
      const res = await request(app).get("/api/messages");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/messages/:chatId", () => {
    it("should return messages for a chat the logged-in user belongs to", async () => {
      const res = await agent.get("/api/messages/1");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
    });

    it("should reject a chat the logged-in user does not belong to", async () => {
      const res = await agent.get("/api/messages/2");

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/messages", () => {
    it("should create a new message in an existing conversation", async () => {
      const res = await agent.post("/api/messages").send({
        receiver: 2,
        listing_id: 4,
        body: "Test message",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.chatId).toBe(1);
      expect(res.body).toHaveProperty("chatId");
      expect(res.body).toHaveProperty("message_id");
      expect(res.body.body).toBe("Test message");
    });

    it("should create a new conversation if one does not exist", async () => {
      const res = await agent.post("/api/messages").send({
        receiver: 3,
        listing_id: 2,
        body: "New conversation test",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.chatId).not.toBe(1);
      expect(res.body).toHaveProperty("chatId");
      expect(res.body.body).toBe("New conversation test");
    });

    it("should ignore fake sender from request body", async () => {
      const res = await agent.post("/api/messages").send({
        sender: 999,
        receiver: 2,
        listing_id: 4,
        body: "Trying to fake sender",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.sender).not.toBe(999);
    });

    it("should reject missing fields", async () => {
      const res = await agent.post("/api/messages").send({
        body: "Missing receiver and listing",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject empty message body", async () => {
      const res = await agent.post("/api/messages").send({
        receiver: 2,
        listing_id: 1,
        body: "   ",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });
});
