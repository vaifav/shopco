import { hashPassword } from "../auth/passwordAuth.js";
import userModel from "../models/signupModel.js";

const createUser = async ({ fname, lname, email, password }) => {
	const isEmailExists = await userModel.findOne({ email });
	if (isEmailExists) throw new Error("Email Already Exists");

	const hashedPassword = await hashPassword(password);
	const user = await userModel.create({ fname, lname, email, password: hashedPassword });
	return user;
};

export default createUser;
