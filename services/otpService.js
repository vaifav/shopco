import { sendOtpVerification } from "../config/otp.js";
import userModel from "../models/signupModel.js";

const verifyOtp = async (_id, otp) => {
	try {
		const user = await userModel.findOne({ _id });
		if (!user) throw new Error("User not found...");

		const currentTime = new Date();

		if (currentTime > user.otpExpires) {
			await userModel.findOneAndUpdate({ _id }, { otp: null, otpExpires: null });
			throw new Error("OTP has expired. Please request a new one.");
		}

		if (user.otp !== otp) throw new Error("Invalid OTP. Please try again.");
		const verifiedUser = await userModel.findOneAndUpdate(
			{ _id },
			{ otp: null, otpExpires: null, isVerified: true },
			{ new: true }
		);

		return verifiedUser;
	} catch (error) {
		throw new Error(error);
	}
};

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};
const resentOtp = async (_id, email) => {
	try {
		const isUserExists = await userModel.findOne({ _id, isVerified: false });
		if (!isUserExists) throw new Error("User Not Found");

		const tenMinutes = 10 * 60 * 1000;
		const otp = generateOTP();
		const otpExpires = new Date(Date.now() + tenMinutes);

		const user = userModel.findOneAndUpdate(
			{ _id },
			{
				otp,
				otpExpires,
				isVerified: false,
			},
			{
				new: true,
			}
		);

		await sendOtpVerification(email, otp);

		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const otpExpireDate = async (_id) => {
	try {
		const user = await userModel.findOne({_id});
		if (!user) throw new Error("User Not Found....");

		return user.otpExpires;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { verifyOtp, resentOtp, otpExpireDate };
