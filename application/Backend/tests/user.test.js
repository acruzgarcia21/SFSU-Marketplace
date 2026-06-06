const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { resetTestDb } = require("./testDb");

describe("User API", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/user/:id", () => {
    // Existing user
    it("should get existing user", async () => {
      const res = await request(app).get("/api/user/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.user_id).toBe(1);
      expect(res.body.user.display_name).toBe("Alex Cruz");
      expect(res.body.user.sfsu_email).toBe("acruz@sfsu.edu");
    });

    // Missing user
    it("should return 404 for missing user", async () => {
      const res = await request(app).get("/api/user/999999");

      expect(res.statusCode).toBe(404);
    });

    // Invalid id
    it.each([
      {
        name: "non-number",
        id: "test",
      },
      {
        name: "decimal",
        id: "1.5",
      },
      {
        name: "negative",
        id: "-1",
      },
      {
        name: "zero",
        id: "0",
      },
    ])("should return 400 for $name id", async ({ id }) => {
      const res = await request(app).get(`/api/user/${id}`);

      expect(res.statusCode).toBe(400);
    });

    // Response structure
    it("should return correct user response structure", async () => {
      const res = await request(app).get("/api/user/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("user_id");
      expect(res.body.user).toHaveProperty("display_name");
      expect(res.body.user).toHaveProperty("sfsu_email");
      expect(res.body.user).toHaveProperty("profile_image");
      expect(res.body.user).toHaveProperty("created_at");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });
  });

  describe("POST /api/user/register", () => {
    const validUser = {
      display_name: "Test User",
      sfsu_email: "testuser@sfsu.edu",
      password: "Password1",
    };

    // Successful registration
    it("should register user with valid input", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("user_id");
      expect(res.body.user.display_name).toBe(validUser.display_name);
      expect(res.body.user.sfsu_email).toBe(validUser.sfsu_email);
      expect(res.body.user.profile_image).toBeNull();
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });

    // Missing required fields
    it.each([
      {
        name: "missing display_name",
        body: {
          sfsu_email: "missingname@sfsu.edu",
          password: "Password1",
        },
      },
      {
        name: "missing sfsu_email",
        body: {
          display_name: "Test User",
          password: "Password1",
        },
      },
      {
        name: "missing password",
        body: {
          display_name: "Test User",
          sfsu_email: "missingpassword@sfsu.edu",
        },
      },
    ])("should return 400 for $name", async ({ body }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send(body);

      expect(res.statusCode).toBe(400);
    });

    // Empty required fields
    it.each([
      {
        name: "empty display_name",
        body: {
          display_name: "",
          sfsu_email: "emptyname@sfsu.edu",
          password: "Password1",
        },
      },
      {
        name: "empty sfsu_email",
        body: {
          display_name: "Test User",
          sfsu_email: "",
          password: "Password1",
        },
      },
      {
        name: "empty password",
        body: {
          display_name: "Test User",
          sfsu_email: "emptypassword@sfsu.edu",
          password: "",
        },
      },
    ])("should return 400 for $name", async ({ body }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send(body);

      expect(res.statusCode).toBe(400);
    });

    // Whitespace-only required fields
    it.each([
      {
        name: "whitespace-only display_name",
        body: {
          display_name: "   ",
          sfsu_email: "whitespacename@sfsu.edu",
          password: "Password1",
        },
      },
      {
        name: "whitespace-only sfsu_email",
        body: {
          display_name: "Test User",
          sfsu_email: "   ",
          password: "Password1",
        },
      },
    ])("should return 400 for $name", async ({ body }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send(body);

      expect(res.statusCode).toBe(400);
    });

    // Trim display name and email
    it("should trim whitespace before and after display_name and sfsu_email", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            display_name: "  Trim User  ",
            sfsu_email: "  trimuser@sfsu.edu  ",
            password: "Password1",
          });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.display_name).toBe("Trim User");
      expect(res.body.user.sfsu_email).toBe("trimuser@sfsu.edu");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });

    // Display name length validation
    it.each([
      {
        name: "exactly minimum display_name length",
        display_name: "A",
        sfsu_email: "minname@sfsu.edu",
      },
      {
        name: "exactly maximum display_name length",
        display_name: "a".repeat(100),
        sfsu_email: "maxname@sfsu.edu",
      },
    ])("should accept $name", async ({ display_name, sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            display_name,
            sfsu_email,
          });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.display_name).toBe(display_name);
    });

    it("should return 400 when display_name exceeds maximum length", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            display_name: "a".repeat(101),
            sfsu_email: "longname@sfsu.edu",
          });

      expect(res.statusCode).toBe(400);
    });

    // Email length validation
    it.each([
      {
        name: "exactly minimum valid sfsu_email length",
        sfsu_email: "a@sfsu.edu",
      },
      {
        name: "exactly maximum sfsu_email length",
        sfsu_email: `${"a".repeat(246)}@sfsu.edu`,
      },
    ])("should accept $name", async ({ sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email,
          });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.sfsu_email).toBe(sfsu_email);
    });

    it("should return 400 when sfsu_email exceeds maximum length", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email: `${"a".repeat(247)}@sfsu.edu`,
          });

      expect(res.statusCode).toBe(400);
    });

    // Password length validation
    it.each([
      {
        name: "exactly minimum password length",
        password: "Aa123456",
        sfsu_email: "minpassword@sfsu.edu",
      },
      {
        name: "exactly maximum password length",
        password: `Aa1${"x".repeat(69)}`,
        sfsu_email: "maxpassword@sfsu.edu",
      },
    ])("should accept $name", async ({ password, sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            password,
            sfsu_email,
          });

      expect(res.statusCode).toBe(201);
    });

    it.each([
      {
        name: "password below minimum length",
        password: "Aa12345",
        sfsu_email: "belowminpasswordlength@sfsu.edu",
      },
      {
        name: "password above maximum length",
        password: `Aa1${"x".repeat(70)}`,
        sfsu_email: "abovemaxpasswordlength@sfsu.edu",
      },
    ])("should return 400 for $name", async ({ password, sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            password,
            sfsu_email,
          });

      expect(res.statusCode).toBe(400);
    });

    // Email validation
    it.each([
      {
        name: "non-sfsu email",
        sfsu_email: "testuser@gmail.com",
      },
      {
        name: "email missing domain",
        sfsu_email: "testuser",
      },
      {
        name: "email with wrong sfsu-like domain",
        sfsu_email: "testuser@mail.sfsu.edu",
      },
    ])("should return 400 for $name", async ({ sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email,
          });

      expect(res.statusCode).toBe(400);
    });

    it("should return 409 when email already exists", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email: "acruz@sfsu.edu",
          });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe("Email is already registered");
    });

    // Password validation
    it.each([
      {
        name: "missing uppercase letter",
        password: "password1",
        sfsu_email: "upperpassword@sfsu.edu",
      },
      {
        name: "missing lowercase letter",
        password: "PASSWORD1",
        sfsu_email: "lowerpassword@sfsu.edu",
      },
      {
        name: "missing number",
        password: "Password",
        sfsu_email: "numberpassword@sfsu.edu",
      },
    ])("should return 400 for password $name", async ({ password, sfsu_email }) => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            password,
            sfsu_email,
          });

      expect(res.statusCode).toBe(400);
    });

    // Optional profile image
    it("should return profile_image when profile image is set", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email: "profileimage@sfsu.edu",
            profile_image: "https://example.com/profile.png",
          });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.profile_image).toBe("https://example.com/profile.png");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });

    it("should return null when profile image is not set", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email: "noprofileimage@sfsu.edu",
          });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.profile_image).toBeNull();
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });

    // Response structure
    it("should return correct registration response structure", async () => {
      const res = await request(app)
          .post("/api/user/register")
          .send({
            ...validUser,
            sfsu_email: "structure@sfsu.edu",
          });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("user_id");
      expect(res.body.user).toHaveProperty("display_name");
      expect(res.body.user).toHaveProperty("sfsu_email");
      expect(res.body.user).toHaveProperty("profile_image");
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });
  });

  describe("POST /api/user/:id/profile_image/upload", () => {
    it("should upload profile image", async () => {
      const res = await request(app)
        .post("/api/user/2/profile_image/upload")
        .attach("image", "./tests/assets/actual.jpg")
        .set("Content-Type", "multipart/form-data");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("pfp upload successful");
    });

    it("should reject missing field 'image'", async () => {
      const res = await request(app)
        .post("/api/user/3/profile_image/upload")
        .set("Content-Type", "multipart/form-data")
        .attach("not_image_field", "./tests/assets/actual.jpg")

      expect(res.statusCode).not.toBe(200); // should be 412, got 500
    });

    it("should reject non-image file", async () => {
      const res = await request(app)
        .post("/api/user/3/profile_image/upload")
        .set("Content-Type", "multipart/form-data")
        .attach("image", "./tests/assets/not_image.txt")

      expect(res.statusCode).toBe(415);
      expect(res.body.message).toBe("File is not an image");
    });

    it("should reject lying image", async () => {
      const res = await request(app)
        .post("/api/user/3/profile_image/upload")
        .set("Content-Type", "multipart/form-data")
        .attach("image", "./tests/assets/lying.png")

      expect(res.statusCode).toBe(415);
      expect(res.body.message).toBe("File MIME type does not match file content");
    })
  })

  describe("GET /api/user/:id/profile_image", () => {
    it("should get profile image path", async () => {
      await request(app)
        .post("/api/user/4/profile_image/upload")
        .set("Content-Type", "multipart/form-data")
        .attach("image", "./tests/assets/actual.jpg")

      const res = await request(app).get("/api/user/4/profile_image");

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toMatch(/^image\//);
    });

    it("should return 404 for missing profile image", async () => {
      const res = await request(app).get("/api/user/999999/profile_image");

      expect(res.statusCode).toBe(404);
    });
  });
});
