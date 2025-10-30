import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.NODEMAILER_EMAIL,
		pass: process.env.NODEMAILER_EMAIL_PASSWORD,
	},
});

const sendOtpVerification = async (email, otp) => {
	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: email,
		subject: "Welcome to SHOP.CO! Your Verification Code",
		html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #333;">Email Verification Required</h2>
                <p>Thank you for signing up! Please use the following code to confirm your email address and activate your account:</p>
                <p style="font-size: 30px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; text-align: center;">
                    ${otp}
                </p>
                <p>This code is valid for a short period of time. Do not share it with anyone.</p>
                <p>If you did not attempt to sign up, please ignore this email.</p>
            </div>
        `,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log("Verification Email sent");
		return true;
	} catch (error) {
		console.error("Error sending verification email:", error);
		throw new Error("Failed to send verification email. Please try again.");
	}
};

const sendForgotPasswordToken = async (email, token) => {
	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: email,
		subject: "SHOP.CO Password Reset Code",
		html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #333;">Password Reset Requested</h2>
            <p>You have requested to reset your password. Please use the following **One-Time Code (OTP)** to proceed with changing your password:</p>
            <p style="font-size: 30px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 20px 0; text-align: center;">
                ${token}
            </p>
            <p>Enter this code on the password reset screen to set your new password.</p>
            <p>This code is valid for a **short period of time** (e.g., 10 minutes). Do not share it with anyone.</p>
            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                If you did not request a password change, please ignore this email. Your password will remain secure.
            </p>
        </div>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending Reset Token:", error);
		throw new Error("Failed to send Reset Token. Please try again.");
	}
};

export { sendOtpVerification, sendForgotPasswordToken };
