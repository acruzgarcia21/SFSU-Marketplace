
/**
 * Checks if all required fields are present in the request body
 * @param {string[]} field - An array of required field names
 * @returns {function} - A middleware function that checks for the presence of the specified fields in the request body
 */

function field_presence_check(fields) {
	/**
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 * @param {function} next
	 */
	return async function(req, res, next) {
		if (req.preconditions_met === false) {
			return next()
		}

		let missing_fields = []

		for (const f of fields) {
			const value = req.body[f]
			if (!value && value !== 0) {
				missing_fields.push(f)
			}
		}

		if (missing_fields.length > 0) {
			req.preconditions_met = false
			req.missing_fields = missing_fields

			const message = `Missing required fields: ${missing_fields.join(", ")}`;
			res.status(412).json({
				message: message,
				error: message,
				missing_fields: missing_fields,
			})
		}

		next();
	};
}

module.exports = {
	field_presence_check,
}