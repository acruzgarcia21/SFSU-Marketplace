const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { resetTestDb } = require("./testDb");

describe("Search API", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/search", () => {
    // Search listings
    it("should return search results", async () => {
      const res = await request(app).get("/api/search");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.count).toBe(res.body.results.length);
    });

    // Category filter
    it("should filter by category", async () => {
      const category = "Textbooks";
      const res = await request(app).get("/api/search").query({ category });

      expect(res.statusCode).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);

      res.body.results.forEach((item) => {
        expect(item.category_name).toBe(category);
      });
    });

    // Search text filter
    it("should filter by search text", async () => {
      const searchText = "Book";
      const res = await request(app).get("/api/search").query({ searchText });

      expect(res.statusCode).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);

      res.body.results.forEach((item) => {
        const searchableText = `${item.title ?? ""} ${item.description ?? ""} ${item.course_tag ?? ""}`;

        expect(searchableText).toMatch(new RegExp(searchText, "i"));
      });
    });

    // Case sensitivity
    it("should be case insensitive for search text", async () => {
      const searchText = "book";
      const mixedText = searchText[0].toUpperCase()
          + searchText.slice(1, 3).toLowerCase()
          + searchText[3].toUpperCase();

      const lower = await request(app).get("/api/search").query({ searchText: searchText.toLowerCase() });
      const upper = await request(app).get("/api/search").query({ searchText: searchText.toUpperCase() });
      const mixed = await request(app).get("/api/search").query({ searchText: mixedText });

      expect(lower.statusCode).toBe(200);
      expect(upper.statusCode).toBe(200);
      expect(mixed.statusCode).toBe(200);
      expect(upper.body.count).toBe(lower.body.count);
      expect(mixed.body.count).toBe(lower.body.count);
    });

    // Handle symbols
    it.each([
      {
        name: "symbol in search text",
        symbol: "!@#$%^&*()",
        keyword: "Book",
      },
      {
        name: "SQL syntax symbol in search text",
        symbol: "' --",
        keyword: "Book",
      },
    ])("should handle $name", async ({ symbol, keyword }) => {
      const searchText = symbol + " " + keyword;
      const res = await request(app).get("/api/search").query({ searchText });
      const keywordRes = await request(app).get("/api/search").query({ searchText: keyword });

      expect(res.statusCode).toBe(200);
      expect(keywordRes.statusCode).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.count).toBe(res.body.results.length);

      const keywordIds = keywordRes.body.results.map((item) => item.listing_id).sort();
      const resIds = res.body.results.map((item) => item.listing_id).sort();

      expect(resIds).toEqual(keywordIds);
    });

    // Price filter
    it.each([
      {
        name: "minimum price",
        minPrice: 40,
        maxPrice: undefined,
      },
      {
        name: "maximum price",
        minPrice: undefined,
        maxPrice: 25,
      },
      {
        name: "price range",
        minPrice: 20,
        maxPrice: 50,
      },
    ])("should filter by $name", async ({ minPrice, maxPrice }) => {
      const res = await request(app).get("/api/search").query({
        ...(minPrice !== undefined && { minPrice }),
        ...(maxPrice !== undefined && { maxPrice }),
      });

      expect(res.statusCode).toBe(200);

      res.body.results.forEach((item) => {
        if (minPrice !== undefined)
          expect(Number(item.price)).toBeGreaterThanOrEqual(minPrice);

        if (maxPrice !== undefined)
          expect(Number(item.price)).toBeLessThanOrEqual(maxPrice);
      });
    });

    // Price filter edge cases
    it.each([
      {
        name: "non-number min price",
        minPrice: "abc",
        maxPrice: undefined,
      },
      {
        name: "non-number max price",
        minPrice: undefined,
        maxPrice: "abc",
      },
    ])("should handle $name", async ({ minPrice, maxPrice }) => {
      const res = await request(app).get("/api/search").query({
        ...(minPrice !== undefined && { minPrice }),
        ...(maxPrice !== undefined && { maxPrice }),
      });

      expect(res.statusCode).toBe(200);
    });

    it.each([
      {
        name: "negative price",
        minPrice: -10,
        maxPrice: undefined,
      },
      {
        name: "decimal price",
        minPrice: 10.5,
        maxPrice: 50.99,
      },
      {
        name: "large price",
        minPrice: undefined,
        maxPrice: 999999999,
      },
    ])("should handle $name", async ({ minPrice, maxPrice }) => {
      const res = await request(app).get("/api/search").query({
        ...(minPrice !== undefined && { minPrice }),
        ...(maxPrice !== undefined && { maxPrice }),
      });

      expect(res.statusCode).toBe(200);

      res.body.results.forEach((item) => {
        if (minPrice !== undefined)
          expect(Number(item.price)).toBeGreaterThanOrEqual(minPrice);

        if (maxPrice !== undefined)
          expect(Number(item.price)).toBeLessThanOrEqual(maxPrice);
      });
    });

    it("should handle min price greater than max price", async () => {
      const res = await request(app).get("/api/search").query({
        minPrice: 100,
        maxPrice: 10,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.results).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    // Free stuff filter (Preserve)

    // Condition filter (Preserve)

    // Combine filters
    it("should filter by category and price range", async () => {
      const category = "Textbooks";
      const minPrice = 20;
      const maxPrice = 100;
      const res = await request(app).get("/api/search").query({ category, minPrice, maxPrice });

      expect(res.statusCode).toBe(200);

      res.body.results.forEach((item) => {
        expect(item.category_name).toBe(category);
        expect(Number(item.price)).toBeGreaterThanOrEqual(minPrice);
        expect(Number(item.price)).toBeLessThanOrEqual(maxPrice);
      });
    });

    // Empty, whitespace search text
    it.each([
      {
        name: "empty search text",
        searchText: "",
      },
      {
        name: "whitespace search text",
        searchText: "        ",
      },
    ])("should handle $name", async ({ searchText }) => {
      const res = await request(app).get("/api/search").query({ searchText });
      const defaultRes = await request(app).get("/api/search");

      expect(res.statusCode).toBe(200);
      expect(defaultRes.statusCode).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.count).toBe(res.body.results.length);

      const defaultIds = defaultRes.body.results.map((item) => item.listing_id).sort();
      const resIds = res.body.results.map((item) => item.listing_id).sort();

      expect(resIds).toEqual(defaultIds);
    });

    // No matches
    it("should return empty results for no matches", async () => {
      const res = await request(app).get("/api/search").query({
        searchText: "noMatchSearchTest",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.results).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    // Multiple keyword search text
    it("should handle multiple keyword search text", async () => {
      const searchText = "Calculus Book";
      const keywords = searchText.toLowerCase().split(/\s+/);

      const res = await request(app).get("/api/search").query({ searchText });

      expect(res.statusCode).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);

      res.body.results.forEach((item) => {
        const searchableText = `${item.title ?? ""} ${item.description ?? ""} ${item.course_tag ?? ""}`
            .toLowerCase();

        const containKeyword = keywords.some((keyword) =>
            searchableText.includes(keyword),
        );

        expect(containKeyword).toBe(true);
      });
    });

    // Long search text
    it("should handle long search text", async () => {
      const searchText = "Book";
      const baseRes = await request(app).get("/api/search").query({ searchText });
      const res = await request(app).get("/api/search").query({
        searchText: `${searchText} `.repeat(1000),
      });

      expect(res.statusCode).toBe(200);
      expect(baseRes.statusCode).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.count).toBe(res.body.results.length);

      const baseIds = baseRes.body.results.map((item) => item.listing_id).sort();
      const resIds = res.body.results.map((item) => item.listing_id).sort();

      expect(resIds).toEqual(baseIds);
    });

    // Response structure
    it("should return correct response structure", async () => {
      const res = await request(app).get("/api/search");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);

      if (res.body.results.length > 0) {
        expect(res.body.results[0]).toHaveProperty("listing_id");
        expect(res.body.results[0]).toHaveProperty("seller_id");
        expect(res.body.results[0]).toHaveProperty("title");
        expect(res.body.results[0]).toHaveProperty("description");
        expect(res.body.results[0]).toHaveProperty("price");
        expect(res.body.results[0]).toHaveProperty("category_name");
        expect(res.body.results[0]).toHaveProperty("course_tag");
        expect(res.body.results[0]).toHaveProperty("pickup_location");
        expect(res.body.results[0]).toHaveProperty("created_at");
        expect(res.body.results[0]).toHaveProperty("seller_name");
        expect(res.body.results[0]).toHaveProperty("image");
      }
    });
  });

  it("should filter free listings using price = 0", async () => {
    const res = await request(app).get("/api/search?category=Free%20Stuff");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);

    res.body.results.forEach((item) => {
      expect(Number(item.price)).toBe(0);
    });
  });
});
