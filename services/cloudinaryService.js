import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

function uploadSingleImage(buffer, id, folder, gravity = null) {
	const transformation = [
		{
			width: 500,
			height: 500,
			crop: "limit",
			quality: "auto:best",
		},
	];

	if (gravity !== null) {
		transformation[0].crop = "fill";
		transformation[0].gravity = gravity;
	}

	const options = {
		folder,
		public_id: id,
		overwrite: true,
		transformation: transformation,
	};
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
			result ? resolve(result) : reject(error);
		});

		streamifier.createReadStream(buffer).pipe(stream);
	});
}

function uploadMultipleImages(buffers, baseId, folder, gravity = null) {
	const uploadPromises = buffers.map((buffer, index) => {
		const publicId = `${baseId}-${index}`;

		return uploadSingleImage(buffer, publicId, folder, gravity);
	});

	return Promise.all(uploadPromises);
}

export { uploadSingleImage, uploadMultipleImages };
