import { sendChangeEmailOtp } from "../config/otp.js";
import personalInfoModel from "../models/personalInfoModel.js";
import userModel from "../models/signupModel.js";

function isNotValidUserName(username, msgName) {
	if (!username) {
		return `${msgName} is required.`;
	}

	const minLength = 3;
	const maxLength = 20;
	if (username.length < minLength || username.length > maxLength) {
		return `${msgName} must be between ${minLength} and ${maxLength} characters long.`;
	}

	const validCharsRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9_.-]+$/;
	if (!validCharsRegex.test(username)) {
		return `${msgName} must contain at least one letter and can only contain letters, numbers, periods (.), hyphens (-), and underscores (_).`;
	}

	if (username.trim() !== username) {
		return `${msgName} cannot contain leading or trailing spaces.`;
	}

	return null;
}

const getPersonalInfo = async (userId) => {
	try {
		if (!userId) throw new Error("User ID is required");
		const personalInfo = await personalInfoModel.findOne({ userId });
		const user = await userModel.findOne({ _id: userId });
		return { personalInfo, email: user.email };
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

		const notValidFname = isNotValidUserName(data.fname, "First name");
		if (notValidFname) throw new Error(notValidFname);
		const notValidLname = isNotValidUserName(data.lname, "Last name");
		if (notValidLname) throw new Error(notValidLname);

		const exists = await personalInfoModel.findOne({ userId });
		if (exists) throw new Error("Personal info already exists for this user");

		const personalInfo = await personalInfoModel.create({ ...data, userId });
		await userModel.findByIdAndUpdate(userId, { isVisitors: false });
		return personalInfo;
	} catch (error) {
		console.error(error);
		if (error.errorResponse.code === 11000) throw new Error(`${data.email} already exists`);
		throw new Error(error.message);
	}
};

const updatePersonalInfo = async (data, userId, file = "") => {
	try {
		if (!userId) throw new Error("userId required");
		const notValidFname = isNotValidUserName(data.fname, "First name");
		if (notValidFname) throw new Error(notValidFname);
		const notValidLname = isNotValidUserName(data.lname, "Last name");
		if (notValidLname) throw new Error(notValidLname);

		const info = await personalInfoModel.findOne({ userId });
		if (!info) {
			const newInfo = await createPersonalInfo(data, userId, file);
			return newInfo;
		}
		if (data.email && info.email !== data.email) {
			const isEmailExists = await userModel.findOne({ email: data.email });
			if (isEmailExists) throw new Error(`${data.email} already exists`);

			await personalInfoModel.findOneAndUpdate(
				{ userId },
				{
					$set: {
						fname: data?.fname,
						lname: data?.lname,
						phone: data?.phone,
						avatar: data?.avatar,
						gender: data?.gender,
						address: data?.address,
					},
				},
				{ new: true, runValidators: true }
			);

			const isGoogleUser = await userModel.exists({ _id: userId, googleId: { $exists: true } });
			if (isGoogleUser) {
				throw new Error("You signed up using Google, so changing email is not allowed.");
			}

			const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

			const tenMinutes = 10 * 60 * 1000;
			const changeEmailOtp = generateOTP();
			const changeEmailOtpExpires = new Date(Date.now() + tenMinutes);

			await userModel.findByIdAndUpdate(userId, {
				changeEmailOtp,
				changeEmailOtpExpires,
				tempEmail: data.email,
			});
			await sendChangeEmailOtp(data.email, changeEmailOtp);

			return {
				isChangeEmailOtpSend: true,
				message: "Check your email we have send the verification code",
			};
		}
		if (data.fname) {
			await userModel.findByIdAndUpdate(userId, { username: data.fname });
		}

		const personalInfo = await personalInfoModel.findOneAndUpdate(
			{ userId },
			{
				$set: {
					fname: data.fname,
					lname: data.lname,
					phone: data.phone,
					avatar: data.avatar,
					gender: data.gender,
					address: data.address,
				},
			},
			{ new: true, runValidators: true }
		);
		if (!personalInfo) throw new Error("Personal Information not found");
		return personalInfo;
	} catch (error) {
		console.error("Error updating Personal Info:", error);
		throw new Error(error.message);
	}
};

export { getPersonalInfo, createPersonalInfo, updatePersonalInfo };
