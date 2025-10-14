import personalInfoModel from "../models/personalInfoModel.js";
import userModel from "../models/signupModel.js";

const getPersonalInfo = async (userId) => {
	try {
		if (!userId) throw new Error("User ID is required");
		const personalInfo = await personalInfoModel.findOne({ userId });
		return personalInfo;
	} catch (error) {
		console.error("Error fetching Personal Info:", error.message);
		throw new Error(error.message);
	}
};

const createPersonalInfo = async (data, userId, file = "") => {
	try {
		if (!userId) throw new Error("userId required");

		const requiredFields = ["fname", "lname", "phone", "email", "gender", "address"];
		for (const field of requiredFields) {
			if (!data[field]) throw new Error(`Field "${field}" is required`);
		}

		const exists = await personalInfoModel.findOne({ userId });
		if (exists) throw new Error("Personal info already exists for this user");

		const personalInfo = await personalInfoModel.create({ ...data, userId });
		return personalInfo;
	} catch (error) {
		console.error("Error creating personal Info:", error.message);
		throw new Error(error.message);
	}
};

const updatePersonalInfo = async (data, userId, file = "") => {
	try {
		if (!userId) throw new Error("userId required");

		const info = await personalInfoModel.findOne({ userId });
		if (!info) {
			const newInfo = await createPersonalInfo(data, userId, file);
			return newInfo;
		}
		if (data.email && info.email !== data.email) {
			const isGoogleUser = await userModel.exists({ _id: userId, googleId: { $exists: true } });
			if (isGoogleUser) throw new Error("You signed up using Google, so changing email is not allowed.");
			await userModel.findByIdAndUpdate(userId, { email: data.email });
		}
		const personalInfo = await personalInfoModel.findOneAndUpdate({ userId }, { $set: data }, { new: true, runValidators: true });
		if (!personalInfo) throw new Error("Personal Information not found");
		return personalInfo;
	} catch (error) {
		console.error("Error updating Personal Info:", error);
		throw new Error(error.message);
	}
};

export { getPersonalInfo, createPersonalInfo, updatePersonalInfo };
