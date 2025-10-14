import { createPersonalInfo, updatePersonalInfo } from "../../services/personalInfoService.js";
import { uploadProfilePic } from "../../services/cloudinaryService.js";

const addPersonalInfo = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const data = req.body;
		const file = req.file;
		const createdPersonalInfo = await createPersonalInfo(data, userId, file);

		return res.status(201).json({
			success: true,
			message: "Personal Info Added SucccessFully",
		});
	} catch (error) {
		console.error("Error adding Personal Info:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

const editPersonlInfo = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const data = req.body;
		const file = req.file;

		const updatedPersonalInfo = await updatePersonalInfo(data, userId, file);
		if (!updatedPersonalInfo) {
			return res.status(404).json({
				success: false,
				message: `Personal Info Not Found`,
			});
		}

		res.status(201).json({
			success: true,
			message: "Personal Info Updatded SucccessFully",
		});

		if (file) {
			try {
				const result = await uploadProfilePic(file.buffer, userId);
				await updatePersonalInfo({ avatar: result.secure_url }, userId);
			} catch (err) {
				console.error("Avatar upload failed:", err.message);
			}
		}
	} catch (error) {
		console.error("Error editing Personal Info:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

export { addPersonalInfo, editPersonlInfo };
