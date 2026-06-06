const path = require("path");
const session = require("express-session");

require("dotenv").config({
  path:
    process.env.NODE_ENV === "test"
      ? path.resolve(__dirname, ".env.test")
      : path.resolve(__dirname, ".env"),
  quiet: true,
});

const express = require("express");
const cors = require("cors");

const searchRoutes = require("./routes/searchRoutes");
const offerRoutes = require("./routes/offerRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const listingRoutes = require("./routes/listingRoutes");
const healthCheck = require("./controllers/healthController");

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: false, // true only if using HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true only with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.get("/api/health", healthCheck);
app.use("/api/search", searchRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/listing", listingRoutes);

module.exports = app;
