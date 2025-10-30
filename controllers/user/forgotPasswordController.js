import { sendTokenToEmail, verifyTokenFromEmail } from "../../services/forgotPasswordService.js";

const getForgotPasswordPage = async (req, res) => {
	return res.render("user/forgotPassword", { error: null });
};

const getUserEmailPage = async (req,res)=>{
    return res.render("user/userEmail", { error: null });
}

const sendToken = async (req, res) => {
	const email = req.body.email;

	if (!email) throw new Error("User Id Not Found....");

	try {
		await sendTokenToEmail(email);
		return res.redirect("/forgotpassword");
	} catch (error) {
		console.log(error);
		return res.render("user/forgotPassword", { error: error.message });
	}
};

const verifyToken = async (req, res) => {
	const { token, newPassword, confirmPassword } = req.body;

	try {
		const user = await verifyTokenFromEmail(token, newPassword, confirmPassword);
		return res.redirect("/login");
	} catch (error) {
		console.log(error);
		return res.render("user/forgotPassword", { error: error.message });
	}
};

export { getForgotPasswordPage, getUserEmailPage,sendToken, verifyToken };
