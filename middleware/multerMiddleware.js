import multer from "multer";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		file.mimetype.startsWith("image/")
			? cb(null, true)
			: cb(new Error("Only image files are allowed!"), false);
	},
});

function generateVariantImageFields(maxVariants) {
	const fields = [];
	for (let i = 0; i < maxVariants; i++) {
		fields.push({ name: `variants[${i}][image]`, maxCount: 4 });
	}
	return fields;
}

const MAX_VARIANTS = 10;
const variantImageFields = generateVariantImageFields(MAX_VARIANTS);
const uploadMultipleVariantImages = upload.fields(variantImageFields);

export { uploadMultipleVariantImages, upload };
