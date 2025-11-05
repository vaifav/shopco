import { otpExpireDate, resentOtp, verifyOtp } from "../../services/otpService.js";

const getOtpPage = async (req, res) => {
	return res.render("user/otp", { error: null });
};

const sendOtp = async (req, res) => {
	const id = req.session.user.userId;
	const otp = req.body.otp;

	if (!id) throw new Error("User Id Not Found....");

	try {
		await verifyOtp(id, otp);
		req.session.user.isVerified = true;

		return res.redirect("/");
	} catch (error) {
		console.log(error);
		return res.render("user/otp", { error: error.message });
	}
};

const resentOtpToEmail = async (req, res) => {
	const id = req.session.user.userId;
	const email = req.session.user.email;
	try {
		await resentOtp(id, email);
		return res.json({
			success: true,
			message: "Resend OTP Successfully, Check Your Email",
		});
	} catch (error) {
		return res.json({
			success: false,
			message: error.message,
		});
	}
};

const otpExpireTimer = async (req, res) => {
	try {
		const otpExpiry = await otpExpireDate(req.session.user.userId);
		if (!otpExpiry) {
			return res.json({});
		}

		return res.json({ date: otpExpiry });
	} catch (error) {
		console.log(error);
		return res.json({});
	}
};

export { getOtpPage, sendOtp, resentOtpToEmail, otpExpireTimer };
