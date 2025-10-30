import { verifyPassword } from "../auth/passwordAuth.js";
import userModel from "../models/signupModel.js";

const checkUser = async ({ email, password }) => {
	try {
		const user = await userModel.findOne({ email }).select("+password");
		if (!user) return false;

		const isCorrectPassword = await verifyPassword(user.password, password);
		if (!isCorrectPassword) return false;

		return user;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export default checkUser;
