const pool = require("../db/pool");
const path = require("path");
const file_system_promises = require("node:fs/promises");
const file_system_ext = require("../utils/file_system");

const listing_directory_input =
  process.env.LISTING_IMAGES_DIR || "internal/listing_images";
const listing_directory = path.join(...listing_directory_input.split("/"));
const absolute_relative_directory = path.resolve(listing_directory);
const attempt_remove = file_system_ext.attempt_remove;
const to_mime = file_system_ext.to_mime;

const getListingOwner = async (listingId) => {
  const [rows] = await pool.execute(
    `
    SELECT seller_id
    FROM Listing
    WHERE listing_id = ?
    LIMIT 1
    `,
    [listingId],
  );

  return rows[0] || null;
};

const getListingById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT
        l.listing_id,
        l.seller_id,
        l.title,
        l.description,
        l.price,
        l.category_name,
        l.course_tag,
        l.pickup_location,
        l.created_at,
        l.item_condition,
        l.status,
        u.display_name AS seller_name,
        li.image_file_path AS image
      FROM Listing l
      JOIN User u
        ON l.seller_id = u.user_id
      LEFT JOIN Listing_Image li
        ON l.listing_id = li.listing_id
       AND li.image_order = 1
      WHERE l.listing_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json({ listing: rows[0] });
  } catch (err) {
    console.error("Get listing by ID error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/listing
const getListings = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        l.listing_id,
        l.seller_id,
        l.title,
        l.description,
        l.price,
        l.category_name,
        l.course_tag,
        l.pickup_location,
        l.created_at,
        l.item_condition,
        l.status,
        u.display_name AS seller,
        li.image_file_path AS image
      FROM Listing l
      JOIN User u
        ON l.seller_id = u.user_id
      LEFT JOIN Listing_Image li
        ON l.listing_id = li.listing_id
       AND li.image_order = 1
      ORDER BY l.created_at DESC
    `);

    return res.json({
      listings: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("Get listings error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/listing
const createListing = async (req, res) => {
  const seller_id = req.user.id;

  const {
    title,
    description,
    price,
    category_name,
    course_tag,
    pickup_location,
    images,
  } = req.body;

  if (
    !title ||
    !description ||
    Number.isNaN(Number(price)) ||
    !category_name ||
    !pickup_location
  ) {
    return res.status(400).json({
      error:
        "title, description, price, category_name, and pickup_location are required",
    });
  }

  if (req.preconditions_met === false) {
    return res.status(412).json({
      message: "Preconditions not met",
    });
  }
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `
      INSERT INTO Listing
      (seller_id, title, description, price, category_name, course_tag, pickup_location, item_condition, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        seller_id,
        title,
        description,
        price,
        category_name,
        course_tag || null,
        pickup_location,
        req.body.item_condition || "Like New",
        "pending",
      ],
    );

    const listingId = result.insertId;

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await connection.execute(
          `
          INSERT INTO Listing_Image
          (listing_id, image_file_path, image_order)
          VALUES (?, ?, ?)
          `,
          [listingId, images[i], i + 1],
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: "Listing created successfully",
      listing: {
        listing_id: listingId,
        seller_id,
        title,
        description,
        price,
        category_name,
        course_tag: course_tag || null,
        pickup_location,
        item_condition: req.body.item_condition || "Like New",
        status: "pending",
        images: images || [],
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Create listing error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/listing/:id/status
const updateListingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const currentUserId = req.user.id;

  const allowedStatuses = ["pending", "active", "sold", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid listing status",
    });
  }

  try {
    const listing = await getListingOwner(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (Number(listing.seller_id) !== Number(currentUserId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await pool.execute(
      `
      UPDATE Listing
      SET status = ?
      WHERE listing_id = ?
      `,
      [status, id],
    );

    return res.json({
      message: "Listing status updated successfully",
      listing_id: Number(id),
      status,
    });
  } catch (err) {
    console.error("Update listing status error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/listing/:id
const deleteListing = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const listing = await getListingOwner(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (Number(listing.seller_id) !== Number(currentUserId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const [imageRows] = await pool.execute(
      `
      SELECT image_file_path
      FROM Listing_Image
      WHERE listing_id = ?
      `,
      [id],
    );

    await pool.execute(
      `
      DELETE FROM Listing
      WHERE listing_id = ?
      `,
      [id],
    );

    for (const row of imageRows) {
      const filePath = path.join(listing_directory, row.image_file_path);

      try {
        await file_system_promises.rm(filePath);
      } catch {
        // ignore missing files
      }
    }

    return res.json({
      message: "Listing deleted successfully",
      listing_id: Number(id),
    });
  } catch (err) {
    console.error("Delete listing error:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
};

// PUT /api/listing/:id
const updateListing = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  const {
    title,
    description,
    price,
    category_name,
    course_tag,
    pickup_location,
    item_condition,
  } = req.body;

  if (
    !title ||
    !description ||
    Number.isNaN(Number(price)) ||
    !category_name ||
    !pickup_location
  ) {
    return res.status(400).json({
      error:
        "title, description, price, category_name, and pickup_location are required",
    });
  }

  try {
    const listing = await getListingOwner(id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (Number(listing.seller_id) !== Number(currentUserId)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await pool.execute(
      `
      UPDATE Listing
      SET
        title = ?,
        description = ?,
        price = ?,
        category_name = ?,
        course_tag = ?,
        pickup_location = ?,
        item_condition = ?
      WHERE listing_id = ?
      `,
      [
        title,
        description,
        price,
        category_name,
        course_tag || null,
        pickup_location,
        item_condition || "Like New",
        id,
      ],
    );

    return res.json({
      message: "Listing updated successfully",
      listing_id: Number(id),
    });
  } catch (err) {
    console.error("Update listing error:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
};

async function upload_listing_images(req, res) {
  const listing_id = req.params.id;
  const currentUserId = req.user.id;
  const files = req.files || [];
  const dump_files = file_system_ext.multer_dump_files;

  try {
    const listing = await getListingOwner(listing_id);

    if (!listing) {
      await dump_files(files);
      return res.status(404).json({ message: "Listing not found" });
    }

    if (Number(listing.seller_id) !== Number(currentUserId)) {
      await dump_files(files);
      return res.status(403).json({ message: "Forbidden" });
    }
  } catch (err) {
    await dump_files(files);
    return res.status(500).json({ message: err.message });
  }

  if (files.length === 0 && !req.body?.imageOrder) {
    return res.status(400).json({
      message: "No images uploaded",
    });
  }

  if (req.preconditions_met === false) {
    await dump_files(files);
    return res.status(412).json({ message: "Preconditions not met" });
  }

  const hasImageOrder = Boolean(req.body.imageOrder);

  try {
    const listingDirectoryExists =
      await file_system_ext.exists(listing_directory);

    if (!listingDirectoryExists) {
      await file_system_promises.mkdir(listing_directory, { recursive: true });
    }

    const [oldImageRows] = await pool.execute(
      `
      SELECT image_file_path
      FROM Listing_Image
      WHERE listing_id = ?
      `,
      [listing_id],
    );

    if (hasImageOrder) {
      let imageOrder = [];

      try {
        imageOrder = JSON.parse(req.body.imageOrder);
      } catch {
        await dump_files(files);
        return res.status(400).json({ message: "Invalid imageOrder JSON" });
      }

      if (!Array.isArray(imageOrder)) {
        await dump_files(files);
        return res.status(400).json({ message: "imageOrder must be an array" });
      }

      const keptExistingNames = new Set(
        imageOrder
          .filter((image) => image.type === "existing")
          .map((image) => image.name),
      );

      await pool.execute(
        `
        DELETE FROM Listing_Image
        WHERE listing_id = ?
        `,
        [listing_id],
      );

      for (const row of oldImageRows) {
        const oldName = row.image_file_path;

        if (keptExistingNames.has(oldName)) continue;
        if (oldName.startsWith("/images/")) continue;

        const oldPath = path.join(listing_directory, oldName);

        try {
          await file_system_promises.rm(oldPath);
        } catch {
          // ignore missing files
        }
      }

      for (let i = 0; i < imageOrder.length; i++) {
        const order = i + 1;
        const image = imageOrder[i];

        if (image.type === "existing") {
          await pool.execute(
            `
            INSERT INTO Listing_Image
            (listing_id, image_file_path, image_order)
            VALUES (?, ?, ?)
            `,
            [listing_id, image.name, order],
          );
        }

        if (image.type === "new") {
          const file = files[image.fileIndex];

          if (!file) continue;

          const imageFileName = `listing_${listing_id}_${order}${path.extname(
            file.originalname,
          )}`;

          const oldPath = file.path;
          const newPath = path.join(listing_directory, imageFileName);

          await file_system_promises.rename(oldPath, newPath);

          await pool.execute(
            `
            INSERT INTO Listing_Image
            (listing_id, image_file_path, image_order)
            VALUES (?, ?, ?)
            `,
            [listing_id, imageFileName, order],
          );
        }
      }

      return res.status(200).json({
        message: "Images updated successfully",
        uploaded: files.length,
      });
    }

    const insertValues = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const order = i + 1;
      const imageFileName = `listing_${listing_id}_${order}${path.extname(
        file.originalname,
      )}`;

      file.new_name = imageFileName;
      insertValues.push(listing_id, imageFileName, order);
    }

    if (insertValues.length === 0) {
      return res.status(200).json({
        message: "No images uploaded",
        uploaded: 0,
      });
    }

    let insertQuery = `
      INSERT INTO Listing_Image (listing_id, image_file_path, image_order)
      VALUES (?, ?, ?)
    `;

    for (let i = 3; i < insertValues.length; i += 3) {
      insertQuery += ", (?, ?, ?)";
    }

    await pool.execute(
      `
      DELETE FROM Listing_Image
      WHERE listing_id = ?
      `,
      [listing_id],
    );

    await pool.execute(insertQuery, insertValues);

    for (const row of oldImageRows) {
      const oldName = row.image_file_path;

      if (oldName.startsWith("/images/")) continue;

      const oldPath = path.join(listing_directory, oldName);

      try {
        await file_system_promises.rm(oldPath);
      } catch {
        // ignore missing files
      }
    }

    for (const file of files) {
      const oldPath = file.path;
      const newPath = path.join(listing_directory, file.new_name);

      await file_system_promises.rename(oldPath, newPath);
    }

    return res.status(200).json({
      message: "Images uploaded successfully",
      uploaded: files.length,
    });
  } catch (err) {
    await dump_files(files);
    return res.status(500).json({ message: err.message });
  }
}

async function get_listing_images_from_db(id) {
  const [result] = await pool.execute(
    `SELECT image_file_path, image_order FROM Listing_Image WHERE listing_id = ? ORDER BY image_order ASC`,
    [id],
  );

  return result;
}

async function get_listing_images(req, res) {
  const { id } = req.params;
  try {
    const images_obj = await get_listing_images_from_db(id);
    const images = images_obj.map((image) => image.image_file_path);

    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getListingById,
  upload_listing_images,
  getListings,
  createListing,
  updateListingStatus,
  deleteListing,
  updateListing,
  get_listing_images_from_db,
  get_listing_images,
  absolute_relative_directory,
};
