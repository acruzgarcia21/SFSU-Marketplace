// current route: /api/user
const express = require("express");
const userControllers = require("../controllers/userControllers");
const multer = require("multer");
const file_system = require("../utils/file_system");
const requireAuth = require("../middleware/auth");

const uploader_mul = multer({
  storage: file_system.multer_disk_storage,
  limits: { fileSize: 5 * 1024 * 1024 /* 5 MiB*/ },
});
const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "Session is working",
    user: req.user,
  });
});

router.get("/:id/exists", userControllers.exists);
router.post(
  "/:id/profile_image/upload",
  uploader_mul.single("image"),
  file_system.multer_single_file_validate,
  userControllers.pfp_upload,
);
router.get("/:id/profile_image", userControllers.pfp_get);

router.get("/:id", userControllers.getUserById);
router.post("/register", userControllers.registerUser);
router.post("/login", userControllers.loginUser);
router.post("/logout", userControllers.logoutUser);
module.exports = router;
