import { getAddress, getSingleAddress } from "../../services/addressService.js";
import { getPersonalInfo } from "../../services/personalInfoService.js";
import { createPersonalInfo, updatePersonalInfo } from "../../services/personalInfoService.js";
import { uploadSingleImage } from "../../services/cloudinaryService.js";
import { checkChangedPassword } from "../../services/forgotPasswordService.js";

const getChangePasswordPage = async (req, res) => {
	return res.render("user/changePassword", { error: null, usermail: req.session.user.email });
};

const changePassword = async (req, res) => {
	const { newPassword, confirmPassword, currentPassword } = req.body;
	try {
		if (newPassword.length < 3) throw new Error("Password length should be greater than three");
		if (newPassword !== confirmPassword) throw new Error("Both Passwords should be same...");

		await checkChangedPassword(req.session.user.userId, currentPassword, newPassword);
		return res.status(201).json({
			success: true,
			message: "Password changed succcessFully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: `${error.message}`,
		});
	}
};

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

		if (file) {
			try {
				const result = await uploadSingleImage(file.buffer, userId, "profiles", "face");
				data.avatar = result.secure_url;
			} catch (err) {
				console.error("Avatar upload failed:", err.message);
			}
		}

		const updatedPersonalInfo = await updatePersonalInfo(data, userId, file);
		if (updatedPersonalInfo.isChangeEmailOtpSend) {
			return res.json({
				success: true,
				message: updatedPersonalInfo.message,
			});
		}
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

const getPersonalInfoPage = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const address = await getAddress(userId);
		const personalInfo = await getPersonalInfo(userId);

		let singleAddress = null;
		if (req.params.id) {
			singleAddress = await getSingleAddress(req.params.id, userId);
		}

		return res.render("user/personalInfo", {
			username: "",
			address,
			singleAddress,
			personalInfo: personalInfo.personalInfo,
			email: personalInfo.email,
		});
	} catch (error) {
		console.error("Error rendering account page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};



export {getPersonalInfoPage, addPersonalInfo, editPersonlInfo, getChangePasswordPage, changePassword };
