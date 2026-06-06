const pool = require("../db/pool");

const searchListings = async (req, res) => {
  const category = req.query.category || "All";
  const minPrice = req.query.minPrice || "";
  const maxPrice = req.query.maxPrice || "";
  const condition = req.query.condition || "All";
  let searchText = req.query.searchText || "";

  if (searchText.length > 100) {
    searchText = searchText.substring(0, 100);
  }

  try {
    let sql = `
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
        u.display_name AS seller_name,
        li.image_file_path AS image
      FROM Listing l
      JOIN User u
        ON l.seller_id = u.user_id
      LEFT JOIN Listing_Image li
        ON l.listing_id = li.listing_id
       AND li.image_order = 1
      WHERE l.status = 'active'
    `;

    const params = [];

    if (category !== "All") {
      if (category === "Free Stuff") {
        sql += " AND l.price = 0";
      } else {
        sql += " AND l.category_name = ?";
        params.push(category);
      }
    }

    if (minPrice !== "" && !isNaN(minPrice)) {
      sql += " AND l.price >= ?";
      params.push(Number(minPrice));
    }

    if (maxPrice !== "" && !isNaN(maxPrice)) {
      sql += " AND l.price <= ?";
      params.push(Number(maxPrice));
    }

    if (condition !== "All") {
      sql += " AND l.item_condition = ?";
      params.push(condition);
    }

    if (searchText.trim() !== "") {
      // Split search text to keywords
      const keywords = searchText.trim().split(/\s+/).filter(keyword => keyword.length > 0);
      const keywordCondition = keywords.map(() => `
        (l.title LIKE ?
        OR l.description LIKE ?
        OR l.course_tag LIKE ?)
        `).join(" OR ");

      sql += ` AND (${keywordCondition})`;

      keywords.forEach(keyword => {
        const likeValue = `%${keyword}%`;
        params.push(likeValue, likeValue, likeValue);
      })

      // Sort by relevance
      // 1. Prioritize whole keyword matches
      // 2. Prioritize more keyword matches
      // 3. Prioritize title matches over description matches
      const replaceRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexPattern = (keyword) => {
        const replace = replaceRegex(keyword);
        return `(^|[^[:alnum:]_])${replace}([^[:alnum:]_]|$)`;
      };

      // Get match score
      const matchScore = (field, useRegex) => {
        return keywords.map(() => `
          CASE
            WHEN ${useRegex ? `REGEXP_LIKE(${field}, ?, 'i')` : `${field} LIKE ?`} THEN 1
            ELSE 0
          END
        `).join(" + ");
      };

      const titleWordMatch = matchScore('l.title', true);
      const titleMatch = matchScore('l.title', false);
      const descrWordMatch = matchScore('l.description', true);
      const descrMatch = matchScore('l.description', false);

      sql += `
        ORDER BY
          (${titleWordMatch}) DESC,
          (${titleMatch}) DESC,
          (${descrWordMatch}) DESC,
          (${descrMatch}) DESC,
          l.created_at DESC
      `;

      const regexValue = keywords.map(regexPattern);
      const likeValue = keywords.map(keyword => `%${keyword}%`);

      params.push(...regexValue, ...likeValue, ...regexValue, ...likeValue);
    } else {
      sql += " ORDER BY l.created_at DESC";
    }

    const [rows] = await pool.execute(sql, params);

    return res.json({
      results: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { searchListings };
