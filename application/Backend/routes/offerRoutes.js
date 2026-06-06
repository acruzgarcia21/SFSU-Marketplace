const express = require("express");
const requireAuth = require("../middleware/auth");

const {
  createOffer,
  getOffersForSeller,
  getOffersForBuyer,
  updateOfferStatus,
} = require("../controllers/offerController");

const router = express.Router();

router.post("/", requireAuth, createOffer);
router.get("/seller", requireAuth, getOffersForSeller);
router.get("/buyer", requireAuth, getOffersForBuyer);
router.patch("/:offerId/status", requireAuth, updateOfferStatus);

module.exports = router;
