const pool = require("../db/pool");

// POST /api/offers
const createOffer = async (req, res) => {
  const buyer_id = req.user.id;
  const { listing_id, offer_amount } = req.body;

  if (!listing_id || !offer_amount) {
    return res.status(400).json({
      error: "listing_id and offer_amount are required",
    });
  }

  try {
    const [listingRows] = await pool.execute(
      `
      SELECT seller_id
      FROM Listing
      WHERE listing_id = ?
      LIMIT 1
      `,
      [listing_id],
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const seller_id = listingRows[0].seller_id;

    if (Number(buyer_id) === Number(seller_id)) {
      return res.status(400).json({
        error: "Buyer cannot make an offer on their own listing",
      });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO Offer (listing_id, buyer_id, seller_id, offer_amount, status)
      VALUES (?, ?, ?, ?, 'pending')
      `,
      [listing_id, buyer_id, seller_id, offer_amount],
    );

    return res.status(201).json({
      message: "Offer created successfully",
      offer: {
        offer_id: result.insertId,
        listing_id,
        buyer_id,
        seller_id,
        offer_amount,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("Create offer error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/offers/seller
const getOffersForSeller = async (req, res) => {
  const sellerId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        o.offer_id,
        o.listing_id,
        o.buyer_id,
        o.seller_id,
        o.offer_amount,
        o.status,
        o.created_at,
        o.updated_at,
        l.title AS listing_title,
        u.display_name AS buyer_name
      FROM Offer o
      JOIN Listing l
        ON o.listing_id = l.listing_id
      JOIN User u
        ON o.buyer_id = u.user_id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
      `,
      [sellerId],
    );

    return res.json({
      offers: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("Get offers for seller error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/offers/buyer
const getOffersForBuyer = async (req, res) => {
  const buyerId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        o.offer_id,
        o.listing_id,
        o.buyer_id,
        o.seller_id,
        o.offer_amount,
        o.status,
        o.created_at,
        o.updated_at,
        l.title AS listing_title,
        u.display_name AS seller_name
      FROM Offer o
      JOIN Listing l
        ON o.listing_id = l.listing_id
      JOIN User u
        ON o.seller_id = u.user_id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
      `,
      [buyerId],
    );

    return res.json({
      offers: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("Get offers for buyer error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/offers/:offerId/status
const updateOfferStatus = async (req, res) => {
  const sellerId = req.user.id;
  const { offerId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["accepted", "declined"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be 'accepted' or 'declined'",
    });
  }

  try {
    const [existingRows] = await pool.execute(
      `
      SELECT offer_id, seller_id, status
      FROM Offer
      WHERE offer_id = ?
      LIMIT 1
      `,
      [offerId],
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const offer = existingRows[0];

    if (Number(offer.seller_id) !== Number(sellerId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [result] = await pool.execute(
      `
      UPDATE Offer
      SET status = ?
      WHERE offer_id = ?
      `,
      [status, offerId],
    );

    return res.json({
      message: "Offer status updated successfully",
      offer_id: Number(offerId),
      status,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("Update offer status error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOffer,
  getOffersForSeller,
  getOffersForBuyer,
  updateOfferStatus,
};
