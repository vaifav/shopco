import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

function uploadProfilePic(buffer, userId) {
	const options = {
		folder: "profiles",
		public_id: userId,
		overwrite: true,
		transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
	};
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
			result ? resolve(result) : reject(error);
		});

		streamifier.createReadStream(buffer).pipe(stream);
	});
}

export { uploadProfilePic };
