import { sendChangeEmailOtp, sendOtpVerification } from "../config/otp.js";
import personalInfoModel from "../models/personalInfoModel.js";
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

const verifyEmailOtp = async (_id, otp) => {
	try {
		const user = await userModel.findOne({ _id });
		if (!user) throw new Error("User not found...");

		const currentTime = new Date();

		if (currentTime > user.changeEmailOtpExpires) {
			await userModel.findOneAndUpdate(
				{ _id },
				{ changeEmailOtp: null, changeEmailOtpExpires: null, tempEmail: null }
			);
			throw new Error("OTP has expired. Please request a new one.");
		}

		if (user.changeEmailOtp !== otp) throw new Error("Invalid OTP. Please try again.");
		const email = await userModel.findOneAndUpdate(
			{ _id },
			{ changeEmailOtp: null, changeEmailOtpExpires: null, email: user.tempEmail },
			{ new: true }
		);
		await personalInfoModel.findOneAndUpdate({ userId: _id }, { email: email.email });

		return email;
	} catch (error) {
		throw new Error(error);
	}
};

const resentOtp = async (_id, email) => {
	const generateOTP = () => {
		return Math.floor(100000 + Math.random() * 900000).toString();
	};
	try {
		const isUserExists = await userModel.findOne({ _id, isVerified: false });
		if (!isUserExists) throw new Error("User Not Found");

		const currentTime = new Date();
		if (isUserExists.otpExpires && currentTime < isUserExists.otpExpires) {
			return { errorMessage: "OTP already exists", dontSendNewOTP: true };
		}

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

const resentChangeEmailOtp = async (_id) => {
	const generateOTP = () => {
		return Math.floor(100000 + Math.random() * 900000).toString();
	};
	try {
		const isUserExists = await userModel.findOne({ _id });
		if (!isUserExists) throw new Error("User Not Found");

		const email = isUserExists.tempEmail;
		if (!email) throw new Error("User Not Found");

		const currentTime = new Date();
		if (isUserExists.changeEmailOtpExpires && currentTime < isUserExists.changeEmailOtpExpires) {
			return { errorMessage: "OTP already exists", dontSendNewOTP: true };
		}

		const tenMinutes = 10 * 60 * 1000;
		const changeEmailOtp = generateOTP();
		const changeEmailOtpExpires = new Date(Date.now() + tenMinutes);

		const user = userModel.findOneAndUpdate(
			{ _id },
			{
				changeEmailOtp,
				changeEmailOtpExpires,
			},
			{
				new: true,
			}
		);

		await sendChangeEmailOtp(email, changeEmailOtp);

		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const otpExpireDate = async (_id) => {
	try {
		const user = await userModel.findOne({ _id });
		if (!user) throw new Error("User Not Found....");

		return { otpExpires: user.otpExpires, changeEmailOtp: user.changeEmailOtpExpires };
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { verifyOtp, verifyEmailOtp, resentOtp, resentChangeEmailOtp, otpExpireDate };
