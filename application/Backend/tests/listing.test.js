const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { resetTestDb } = require("./testDb");
const path = require("path");
const file_system_promises = require("node:fs/promises");
const file_system_ext = require("../utils/file_system");

describe("Listing API", () => {
  let alexAgent;

  beforeEach(async () => {
    await resetTestDb();

    alexAgent = request.agent(app);

    await alexAgent.post("/api/user/login").send({
      sfsu_email: "acruz@sfsu.edu",
      password: "pw1",
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/listing", () => {
    it("should return all listings", async () => {
      const res = await request(app).get("/api/listing");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.listings)).toBe(true);
      expect(res.body.count).toBe(res.body.listings.length);
      expect(res.body.listings.length).toBeGreaterThan(0);
    });

    it("should return listing fields needed by frontend", async () => {
      const res = await request(app).get("/api/listing");

      const listing = res.body.listings[0];

      expect(listing).toHaveProperty("listing_id");
      expect(listing).toHaveProperty("title");
      expect(listing).toHaveProperty("price");
      expect(listing).toHaveProperty("image");
      expect(listing).toHaveProperty("seller");
      expect(listing).toHaveProperty("category_name");
    });
  });

  describe("POST /api/listing", () => {
    it("should create a new listing", async () => {
      const res = await alexAgent.post("/api/listing").send({
        title: "Test Listing",
        description: "A test item",
        price: 25.0,
        category_name: "Textbooks",
        course_tag: "CSC 648",
        pickup_location: "Library",
        images: ["/images/test.jpg"],
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("listing");
      expect(res.body.listing).toHaveProperty("listing_id");
      expect(res.body.listing.title).toBe("Test Listing");
      expect(res.body.listing.seller_id).toBe(1);
      expect(res.body.listing.category_name).toBe("Textbooks");
      expect(res.body.listing.images).toEqual(["/images/test.jpg"]);
    });

    it("should insert created listing into database", async () => {
      const createRes = await alexAgent.post("/api/listing").send({
        title: "DB Insert Test",
        description: "Checking DB insert",
        price: 10.0,
        category_name: "Electronics",
        pickup_location: "Library",
        images: ["/images/db-test.jpg"],
      });

      const listingId = createRes.body.listing.listing_id;

      const [rows] = await pool.query(
        "SELECT * FROM Listing WHERE listing_id = ?",
        [listingId],
      );

      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe("DB Insert Test");
    });

    it("should insert listing image into database", async () => {
      const createRes = await alexAgent.post("/api/listing").send({
        title: "Image Insert Test",
        description: "Checking image insert",
        price: 15.0,
        category_name: "Furniture",
        pickup_location: "Library",
        images: ["/images/image-test.jpg"],
      });

      const listingId = createRes.body.listing.listing_id;

      const [rows] = await pool.query(
        "SELECT * FROM Listing_Image WHERE listing_id = ?",
        [listingId],
      );

      expect(rows.length).toBe(1);
      expect(rows[0].image_file_path).toBe("/images/image-test.jpg");
      expect(rows[0].image_order).toBe(1);
    });

    it("should reject missing required fields", async () => {
      const res = await alexAgent.post("/api/listing").send({
        title: "Bad Listing",
      });

      expect(res.statusCode).toBe(412);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("missing_fields");
      expect(res.body.missing_fields).toEqual(
        expect.arrayContaining([
          "description",
          "price",
          "category_name",
          "pickup_location",
        ]),
      );
    });
  });

  describe("POST /api/listing/:id/images", () => {
    it("should upload multiple images as intended", async () => {
      const res = await alexAgent
        .post("/api/listing/1/images")
        .attach("images", "./tests/assets/actual.jpg")
        .attach("images", "./tests/assets/actual.jpg");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Images uploaded successfully");
      expect(res.body).toHaveProperty("uploaded");
      expect(res.body.uploaded).toBe(2);
    });

    it("should accept more than two images and of different image formats", async () => {
      const res = await alexAgent
        .post("/api/listing/1/images")
        .attach("images", "./tests/assets/actual.png")
        .attach("images", "./tests/assets/actual.png")
        .attach("images", "./tests/assets/actual.png");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Images uploaded successfully");
      expect(res.body).toHaveProperty("uploaded");
      expect(res.body.uploaded).toBe(3);
    });

    it("should reject empty entries", async () => {
      const res = await alexAgent.post("/api/listing/1/images");

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("No images uploaded");
    });

    it("should reject non-image files", async () => {
      const res = await alexAgent
        .post("/api/listing/1/images")
        .attach("images", "./tests/assets/not_image.txt");

      expect(res.statusCode).toBe(412);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Only image files are allowed");
      expect(res.body).toHaveProperty("failed_index");
      expect(res.body.failed_index).toBe(0);
    });

    it("should reject lying images", async () => {
      const res = await alexAgent
        .post("/api/listing/1/images")
        .attach("images", "./tests/assets/lying.png");

      expect(res.statusCode).toBe(415);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe(
        "File MIME type does not match file content",
      );
      expect(res.body).toHaveProperty("failed_index");
      expect(res.body.failed_index).toBe(0);
    });

    it("should have accurate failed_index for multiple files", async () => {
      const res = await alexAgent
        .post("/api/listing/1/images")
        .attach("images", "./tests/assets/actual.jpg")
        .attach("images", "./tests/assets/not_image.txt")
        .attach("images", "./tests/assets/lying.png");

      expect(res.statusCode).toBe(412);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Only image files are allowed");
      expect(res.body).toHaveProperty("failed_index");
      expect(res.body.failed_index).toBe(1);
    });

    it("should reject images if there's 7 or more", async () => {
      const req = alexAgent.post("/api/listing/1/images");

      for (let i = 0; i < 7; i++) {
        req.attach("images", "./tests/assets/actual.jpg");
      }

      const res = await req;

      expect(res.statusCode).not.toBe(200);
    });
  });
});
