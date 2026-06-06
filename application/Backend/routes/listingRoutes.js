// current route: /api/listing
const express = require("express");
const listingControllers = require("../controllers/listingControllers");
const multer = require("multer");
const file_system = require("../utils/file_system");
const requireAuth = require("../middleware/auth");
const express_ext = require("../utils/express_ext");
const uploader_many = multer({
  storage: file_system.multer_disk_storage,
  limits: {
    fileSize: 5 * 1024 * 1024 /* 5 MiB*/,
  },
});

const validateImagesOnlyWhenUploading = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  return file_system.multer_file_validate_multiple(req, res, next);
};

const router = express.Router();

router.get("/:id", listingControllers.getListingById);
router.get("/", listingControllers.getListings);
router.post(
  "/",
  requireAuth,
  express_ext.field_presence_check([
    "title",
    "description",
    "price",
    "category_name",
    "pickup_location",
  ]),
  listingControllers.createListing,
);

router.patch(
  "/:id/status",
  requireAuth,
  listingControllers.updateListingStatus,
);

router.delete("/:id", requireAuth, listingControllers.deleteListing);
router.put("/:id", requireAuth, listingControllers.updateListing);

router.post(
  "/:id/images",
  requireAuth,
  uploader_many.array("images", 6),
  validateImagesOnlyWhenUploading,
  listingControllers.upload_listing_images,
);

router.get("/:id/images", listingControllers.get_listing_images);
router.use(
  "/image",
  express.static(listingControllers.absolute_relative_directory),
);

module.exports = router;
