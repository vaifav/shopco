import { verifyOtp } from "../../services/otpService.js";

const getOtpPage = async (req, res) => {
	return res.render("user/otp", { error: null });
};

const sendOtp = async (req, res) => {
	const id = req.session.user.userId;
	const otp = req.body.otp;

	if (!id) throw new Error("User Id Not Found....");

	try {
		await verifyOtp(id, otp);
		req.session.isVerified = true;

		return res.redirect("/");
	} catch (error) {
		console.log(error);
		return res.render("user/otp", { error: error.message });
	}
};

export { getOtpPage, sendOtp };
