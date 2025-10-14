import multer from "multer";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only image files are allowed!"), false);
	},
});

export default upload;
