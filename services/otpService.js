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

export { verifyOtp };
