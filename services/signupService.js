import { hashPassword } from "../auth/passwordAuth.js";
import { sendOtpVerification } from "../config/otp.js";
import userModel from "../models/signupModel.js";

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

function isNotValidUserName(username) {
	if (!username) {
		return "Username is required.";
	}

	const minLength = 3;
	const maxLength = 20;
	if (username.length < minLength || username.length > maxLength) {
		return `Username must be between ${minLength} and ${maxLength} characters long.`;
	}

	const validCharsRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9_.-]+$/;
	if (!validCharsRegex.test(username)) {
		return "Username can only contain letters, numbers, periods (.), hyphens (-), and underscores (_).";
	}

	if (username.trim() !== username) {
		return "Username cannot contain leading or trailing spaces.";
	}

	return null;
}

const createUser = async ({ username, email, password, confirmPassword }) => {
	try {
		const notValidUserName = isNotValidUserName(username)
		if(notValidUserName) throw new Error(notValidUserName);
		 
		const isEmailExists = await userModel.findOne({ email, isVerified: true });
		if (isEmailExists) throw new Error("Email Already Exists");
		if (password.trim() !== confirmPassword.trim()) throw new Error("Both Passwords should be same");

		const hashedPassword = await hashPassword(password);

		const oneMinute = 1 * 60 * 1000;
		const otp = generateOTP();
		const otpExpires = new Date(Date.now() + oneMinute);

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
