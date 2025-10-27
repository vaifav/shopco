import crypto from "crypto";
import { uploadSingleImage } from "../../services/cloudinaryService.js";

const processVariantImages = async (variants, files, public_id = []) => {
	if (!Array.isArray(public_id)) throw new Error("public_id must be an array");

	const variantImageUploadPromises = [];
	const MAX_VARIANTS = 10;

	for (let i = 0; i < MAX_VARIANTS; i++) {
		const fileArray = files[`variants[${i}][image]`];

		if (fileArray && fileArray.length > 0 && variants[i]) {
			variants[i].images = [];

			const variantUploads = fileArray.map((file, index) => {
				if (public_id.length === 0) {
					const promise = uploadSingleImage(file.buffer, crypto.randomUUID(), "productVariants").then(
						(result) => {
							variants[i].images.push(result.secure_url);
						}
					);
					return promise;
				} else {
					const promise = uploadSingleImage(file.buffer, public_id[i], "productVariants").then(
						(result) => {
							variants[i].images.push(result.secure_url);
						}
					);
					return promise;
				}

			});

			variantImageUploadPromises.push(...variantUploads);
		}
	}

	if (variantImageUploadPromises.length !== 0) {
		await Promise.all(variantImageUploadPromises);
	}
};

export { processVariantImages };
