import { hashPassword } from "../auth/passwordAuth.js";
import { sendForgotPasswordToken } from "../config/otp.js";
import userModel from "../models/signupModel.js";
import crypto from "crypto";

const sendTokenToEmail = async (email) => {
	try {
		const isUserExists = await userModel.findOne({ email });
		if (!isUserExists) throw new Error("User not found...");

		const tenMinutes = 10 * 60 * 1000;
		const changePasswordToken = crypto.randomBytes(32).toString("hex");
		const changePasswordTokenExpires = new Date(Date.now() + tenMinutes);

		const user = await userModel.findOneAndUpdate(
			{ email },
			{ changePasswordToken, changePasswordTokenExpires },
			{ new: true }
		);

		await sendForgotPasswordToken(email, changePasswordToken);
		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const verifyTokenFromEmail = async (token, newPassword, confirmPassword) => {
	try {
		const isUserExists = await userModel.findOne({ changePasswordToken: token });
		if (!isUserExists) throw new Error("User not found...");

		const userId = isUserExists._id;
		const currentTime = new Date();
		if (currentTime > isUserExists.changePasswordTokenExpires) {
			await userModel.findOneAndUpdate(
				{ _id: userId },
				{ changePasswordToken: null, changePasswordTokenExpires: null },
				{ new: true, runValidators: true }
			);
			throw new Error("Your Token Expired. Try again...");
		}
		if (isUserExists.changePasswordToken !== token) throw new Error("Invalid Token, Try again....");
		if (newPassword !== confirmPassword) throw new Error("Both passwords should be same...");

		const hashNewPassword = await hashPassword(newPassword);
		const user = await userModel.findOneAndUpdate(
			{ _id: userId },
			{ changePasswordToken: null, changePasswordTokenExpires: null, password: hashNewPassword },
			{ new: true }
		);
		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { sendTokenToEmail, verifyTokenFromEmail };
