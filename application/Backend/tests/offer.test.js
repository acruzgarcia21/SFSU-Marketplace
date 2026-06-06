const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { resetTestDb } = require("./testDb");

describe("Offer API", () => {
  let offerId;
  let alexAgent;
  let krishAgent;

  beforeEach(async () => {
    await resetTestDb();

    alexAgent = request.agent(app);
    krishAgent = request.agent(app);

    await alexAgent.post("/api/user/login").send({
      sfsu_email: "acruz@sfsu.edu",
      password: "pw1",
    });

    await krishAgent.post("/api/user/login").send({
      sfsu_email: "krish@sfsu.edu",
      password: "pw2",
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("POST /api/offers", () => {
    it("should create a new offer", async () => {
      const res = await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("offer");
      expect(res.body.offer).toHaveProperty("offer_id");
      expect(res.body.offer.listing_id).toBe(1);
      expect(res.body.offer.buyer_id).toBe(2);
      expect(res.body.offer.seller_id).toBe(1);
      expect(res.body.offer.status).toBe("pending");

      offerId = res.body.offer.offer_id;
    });

    it("should fail with missing fields", async () => {
      const res = await krishAgent.post("/api/offers").send({
        listing_id: 1,
      });

      expect(res.statusCode).toBe(400);
    });

    it("should reject buyer making offer on own listing", async () => {
      const res = await alexAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject offer for missing listing", async () => {
      const res = await krishAgent.post("/api/offers").send({
        listing_id: 999999,
        offer_amount: 100,
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/offers/seller", () => {
    it("should return seller offers", async () => {
      await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      const res = await alexAgent.get("/api/offers/seller");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.offers)).toBe(true);
    });
  });

  describe("GET /api/offers/buyer", () => {
    it("should return buyer offers", async () => {
      await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      const res = await krishAgent.get("/api/offers/buyer");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.offers)).toBe(true);
      expect(res.body).toHaveProperty("count");
      expect(res.body.count).toBe(1);
    });
  });

  describe("PATCH /api/offers/:id/status", () => {
    it("should update status", async () => {
      const createRes = await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      offerId = createRes.body.offer.offer_id;

      const res = await alexAgent
        .patch(`/api/offers/${offerId}/status`)
        .send({ status: "accepted" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("accepted");
      expect(res.body.offer_id).toBe(offerId);
      expect(res.body.affectedRows).toBe(1);
    });

    it("should reject invalid status", async () => {
      const createRes = await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      offerId = createRes.body.offer.offer_id;

      const res = await alexAgent
        .patch(`/api/offers/${offerId}/status`)
        .send({ status: "invalid_status" });

      expect(res.statusCode).toBe(400);
    });

    it("should reject fake buyer_id from request body", async () => {
      const res = await krishAgent.post("/api/offers").send({
        listing_id: 1,
        buyer_id: 999,
        offer_amount: 100,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.offer.buyer_id).toBe(2);
      expect(res.body.offer.buyer_id).not.toBe(999);
    });

    it("should prevent non-seller from updating offer status", async () => {
      const createRes = await krishAgent.post("/api/offers").send({
        listing_id: 1,
        offer_amount: 100,
      });

      const offerId = createRes.body.offer.offer_id;

      const res = await krishAgent
        .patch(`/api/offers/${offerId}/status`)
        .send({ status: "accepted" });

      expect(res.statusCode).toBe(403);
    });
  });
});
