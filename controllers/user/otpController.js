import {
	otpExpireDate,
	resentOtp,
	verifyOtp,
	verifyEmailOtp,
	resentChangeEmailOtp,
} from "../../services/otpService.js";

const getOtpPage = async (req, res) => {
	const resetEmail = req.query.resetemailotp;
	console.log(resetEmail);

	return res.render("user/otp", { error: null, resetEmail });
};

const sendOtp = async (req, res) => {
	const id = req.session.user.userId;
	const otp = req.body.otp;
	const isEmailReset = req.body.emailReset === "true";

	if (!id) throw new Error("User Id Not Found....");

	try {
		if (isEmailReset) {
			await verifyEmailOtp(id, otp);
			return res.redirect("/account");
		}

		await verifyOtp(id, otp);
		req.session.user.isVerified = true;
		return res.redirect("/");
	} catch (error) {
		console.error(error);
		const resetEmailFlag = isEmailReset ? "true" : null;

		return res.render("user/otp", {
			error: error.message,
			resetEmail: resetEmailFlag,
		});
	}
};

const resentOtpToEmail = async (req, res) => {
	const id = req.session.user.userId;
	const email = req.session.user.email;
	const emailReset = req.body.emailReset;

	try {
		if (emailReset) {
			const emailOtp = await resentChangeEmailOtp(id);
			if (emailOtp.dontSendNewOTP) {
				return res.json({
					success: false,
					message: emailOtp.errorMessage,
				});
			}
		} else {
			const otp = await resentOtp(id, email);
			if (otp.dontSendNewOTP) {
				return res.json({
					success: false,
					message: otp.errorMessage,
				});
			}
		}
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

		return res.json({ otpDate: otpExpiry.otpExpires, emailOtpDate: otpExpiry.changeEmailOtp });
	} catch (error) {
		console.log(error);
		return res.json({});
	}
};

export { getOtpPage, sendOtp, resentOtpToEmail, otpExpireTimer };
