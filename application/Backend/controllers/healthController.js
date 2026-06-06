const pool = require("../db/pool");

const healthCheck = async (req, res) => {
  try {
	await pool.query("SELECT 1");
	return res.json({ ok: true, db: "connected" });
  } catch (err) {
	return res.status(500).json({
	  ok: false,
	  db: "error",
	  message: err.message,
	});
  }
};

module.exports = healthCheck