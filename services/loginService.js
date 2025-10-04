import { verifyPassword } from "../auth/passwordAuth.js";
import userModel from "../models/signupModel.js";

const checkUser = async ({ email, password }) => {
	const user = await userModel.findOne({ email });
	if (!user) return false;

	const isCorrectPassword = await verifyPassword(user.password, password);
	if (!isCorrectPassword) return false;

	return user;
};

export default checkUser;
