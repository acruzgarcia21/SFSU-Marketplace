const fs_promises = require("node:fs/promises");
const magic_bytes = require("magic-bytes.js").filetypemime;
const multer = require("multer")

const minimum_bytes = 100
const multer_disk_storage = multer.diskStorage({
	destination: process.env.MULTER_DESTINATION, 
})

async function exists(path){
	let result = true

	try {
		await fs_promises.stat(path)
	} catch (err) {
		if (err.code === "ENOENT") result = false
		else throw err
	}

	return result
}

/**
 * @param {string} path_to 
 * @return {string}
 */
async function to_mime(path_to) {
	let file_handle = await fs_promises.open(path_to)
	let buffer = Buffer.alloc(minimum_bytes)

	await file_handle.read(buffer, 0, minimum_bytes, 0)

	let mimes = magic_bytes(buffer)

	await file_handle.close()

	return mimes[0]
}

/**
 * Removes a file if it exists, otherwise does nothing, boolean denotes whether the file was removed or not
 * @param {string} path 
 * @return {Promise<boolean>}
 */
async function attempt_remove(path){
	const does_exist = await exists(path)
	if (does_exist) {
		await fs_promises.rm(path)
	}
	return does_exist
}

/** 
 * Validates a Multer file object, checking if it is an image and if its MIME type matches its content. Returns an object with a boolean 'valid' field and a 'message' field describing the validation result.
 * @param {import("express").Multer.File} file_object
 * @return {Promise<{ valid: boolean, message: string }>}
*/
async function multer_file_validate(file_object) {
	const claimed_mime = file_object.mimetype
	const file_path = file_object.path
	const mime_validation_result = await to_mime(file_path)
	const is_valid = mime_validation_result == claimed_mime

	return {
		valid: is_valid,
		message: is_valid ? "MIME type matches file content" : "File MIME type does not match file content"
	}
}

/**
 * Validates an upcoming singleton file as middleware
 * For now this strictly checks if the file is an image and is considered multer_valid
 */
async function multer_single_file_validate(req, res, next) {
	const file = req.file

	if (req.preconditions_met === false) {
		return next()
	}

	req.preconditions_met = false

	if (!file) {
		res.status(412).json({ message: "No file uploaded" })
		return next()
	}

	const path = file.path
	const mime_type = file.mimetype

	if (!mime_type.startsWith("image/")) {
		await attempt_remove(path)
		res.status(415).json({ message: "File is not an image" })
		return next()
	}

	const validation_result = await multer_file_validate(file)

	if (!validation_result.valid) {
		await attempt_remove(path)
		res.status(415).json({ message: validation_result.message })
		return next()
	}

	req.preconditions_met = true

	return next()
}

/**
 * @param { import("express").Multer.File[] } files 
 */
async function multer_dump_files(files) {
	for (const file of files) {
		await attempt_remove(file.path)
	}
}

/**
 * Validates an upcoming multiple files as middleware
 * For now this strictly checks if the files are images and are considered multer_valid
 */
async function multer_file_validate_multiple(req, res, next) {
	const files = req.files

	if (req.preconditions_met === false) {
		return next()
	}

	req.preconditions_met = false

	if (!files || files.length === 0) {
		res.status(400).json({ message: "No images uploaded" })
		return next()
	}

	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		const path = file.path
		const mime_type = file.mimetype

		if (!mime_type.startsWith("image/")) {
			await multer_dump_files(files)
			res.status(412).json({ 
				message: "Only image files are allowed",
				failed_index: i
			})
			return next()
		}
		const validation_result = await multer_file_validate(file)

		if (!validation_result.valid) {
			await multer_dump_files(files)
			res.status(415).json({ 
				message: validation_result.message,
				failed_index: i
			})
			return next()
		}
	}

	req.preconditions_met = true

	return next()
}

module.exports = {
	exists,
	attempt_remove,
	to_mime,
	multer_file_validate,
	multer_single_file_validate,
	multer_file_validate_multiple,
	multer_dump_files,

	multer_disk_storage,
}