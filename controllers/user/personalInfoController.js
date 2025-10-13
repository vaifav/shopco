import { createPersonalInfo, updatePersonalInfo } from "../../services/personalInfoService.js";

const addPersonalInfo = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const data = req.body;
		const createdPersonalInfo = await createPersonalInfo(data, userId);

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

		const updatedPersonalInfo = await updatePersonalInfo(data, userId);
		if (!updatedPersonalInfo) {
			return res.status(404).json({
				success: false,
				message: `Personal Info Not Found`,
			});
		}

		return res.status(201).json({
			success: true,
			message: "Personal Info Updatded SucccessFully",
		});
	} catch (error) {
		console.error("Error editing Personal Info:", error.message);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

export { addPersonalInfo, editPersonlInfo };
