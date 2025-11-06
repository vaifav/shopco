import { verifyPassword } from "../auth/passwordAuth.js";
import { sendOtpVerification } from "../config/otp.js";
import userModel from "../models/signupModel.js";

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const checkUser = async ({ email, password }) => {
	try {
		const user = await userModel.findOne({ email }).select("+password");
		if (!user) throw new Error("Invalid Credentials");
		if (!user.isVerified) {
			const tenMinutes = 10 * 60 * 1000;
			const otp = generateOTP();
			const otpExpires = new Date(Date.now() + tenMinutes);

			const userOTP = await userModel.findOneAndUpdate(
				{ email },
				{
					otp,
					otpExpires,
					isVerified: false,
				},
				{
					new: true,
					upsert: true,
				}
			);

			await sendOtpVerification(email, otp);
			return { otpPage: true , user: userOTP};
		}

		const isCorrectPassword = await verifyPassword(user.password, password);
		if (!isCorrectPassword) throw new Error("Invalid Credentials");
		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export default checkUser;
