const file_system_promises = require("node:fs/promises");
const file_system_ext = require("../utils/file_system");
const path = require("node:path");
const pool = require("../db/pool");
const { hashPassword, comparePassword } = require("../utils/hash");

const user_profile_images_dir_input =
  process.env.USER_PROFILE_IMAGES_DIR || "internal/profile_images";
const user_profile_images_dir = path.join(
  ...user_profile_images_dir_input.split("/"),
);

const to_mime = file_system_ext.to_mime;
const attempt_remove = file_system_ext.attempt_remove;

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function exists(req, res) {
  res.status(200).json({ message: "true" });
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function pfp_upload(req, res) {
  // pre
  let file = req.file;

  if (req.preconditions_met === false) {
    return res
      .status(400)
      .json({ message: "File did not meet validation preconditions" });
  }

  // main
  let { id } = req.params;
  let new_path = path.join(user_profile_images_dir, id);

  if (!(await file_system_ext.exists(user_profile_images_dir))) {
    await file_system_promises.mkdir(user_profile_images_dir, {
      recursive: true,
    });
  }

  await file_system_promises.rename(file.path, new_path);

  res.status(200).json({ message: "pfp upload successful" });
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function pfp_get(req, res) {
  let { id } = req.params;

  let file_path = path.join(user_profile_images_dir, id);
  if (!(await file_system_ext.exists(file_path))) {
    return res.status(404).json({ message: "User profile image not found" });
  }

  let mime_type = await to_mime(file_path);
  let absolute_path = path.resolve(file_path);

  return res.status(200).set("Content-Type", mime_type).sendFile(absolute_path);
}

// GET /api/users/:id
const getUserById = async (req, res) => {
  const { id } = req.params;

  // ID validation
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0)
    return res.status(400).json({ error: "Invalid user ID" });

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        user_id,
        display_name,
        sfsu_email,
        profile_image,
        created_at
      FROM User
      WHERE user_id = ?
      LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("Get user by ID error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/user/register
const registerUser = async (req, res) => {
  let { display_name, sfsu_email, password, profile_image } = req.body;

  // Validation
  if (!display_name || !sfsu_email || !password)
    return res
      .status(400)
      .json({ error: "Display name, email and password are required" });

  display_name = display_name.trim();
  sfsu_email = sfsu_email.trim();

  if (!display_name || !sfsu_email || !password)
    return res.status(400).json({ error: "Fields cannot be empty" });

  if (display_name.length > 100)
    return res
      .status(400)
      .json({ error: "Display name cannot exceed 100 characters" });

  if (sfsu_email.length > 255)
    return res
      .status(400)
      .json({ error: "Email cannot exceed 255 characters" });

  if (password.length > 72 || password.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be 8 - 72 characters" });

  if (!sfsu_email.endsWith("@sfsu.edu"))
    return res.status(400).json({ error: "Email must be a SFSU email" });

  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  )
    return res.status(400).json({ error: "Password must meet requirements" });

  try {
    const [existingRows] = await pool.execute(
      `
      SELECT user_id
      FROM User
      WHERE sfsu_email = ?
      LIMIT 1
      `,
      [sfsu_email],
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool.execute(
      `
      INSERT INTO User (display_name, sfsu_email, password_hash, profile_image)
      VALUES (?, ?, ?, ?)
      `,
      [display_name, sfsu_email, hashedPassword, profile_image || null],
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        user_id: result.insertId,
        display_name,
        sfsu_email,
        profile_image: profile_image || null,
      },
    });
  } catch (err) {
    console.error("Register user error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/user/login
const loginUser = async (req, res) => {
  let { sfsu_email, password } = req.body;

  // Validation
  if (!sfsu_email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  sfsu_email = sfsu_email.trim();

  if (!sfsu_email)
    return res.status(400).json({ error: "Email cannot be empty" });

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        user_id,
        display_name,
        sfsu_email,
        password_hash,
        profile_image,
        created_at
      FROM User
      WHERE sfsu_email = ?
      LIMIT 1
      `,
      [sfsu_email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const passwordMatches = await comparePassword(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.user = {
      id: user.user_id,
      user_id: user.user_id,
      display_name: user.display_name,
      sfsu_email: user.sfsu_email,
      profile_image: user.profile_image,
      created_at: user.created_at,
    };

    return res.json({
      message: "Login successful",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Login user error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");

    return res.json({
      message: "Logged out successfully",
    });
  });
};

module.exports = {
  exists,
  pfp_upload,
  pfp_get,
  getUserById,
  registerUser,
  loginUser,
  logoutUser,
};
