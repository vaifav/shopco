import { hashPassword } from "../auth/passwordAuth.js";
import { sendOtpVerification } from "../config/otp.js";
import userModel from "../models/signupModel.js";

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const createUser = async ({ username, email, password }) => {
	try {
		const isEmailExists = await userModel.findOne({ email, isVerified: true });
		if (isEmailExists) throw new Error("Email Already Exists");

		const tenMinutes = 10 * 60 * 1000;
		const otp = generateOTP();
		const otpExpires = new Date(Date.now() + tenMinutes);

		const hashedPassword = await hashPassword(password);
		const user = await userModel.findOneAndUpdate(
			{ email },
			{
				username,
				email,
				password: hashedPassword,
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
		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export default createUser;
