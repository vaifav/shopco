import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

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
	const resetUrl = `http://localhost:7000/forgotpassword?token=${token}`;
	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: email,
		subject: "SHOP.CO Password Reset Code",
		html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #333;">Password Reset Requested</h2>
            <p>You have requested to reset your password. Please click the link below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a 
                    href="${resetUrl}"
                    target="_blank"
                    style="
                        background-color: #007bff; 
                        color: white; 
                        padding: 12px 25px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                    "
                >
                    Reset My Password
                </a>
            </div>           
           <p>If the button above doesn't work, you can copy and paste the following link into your web browser:</p>
            <p style="font-size: 14px; color: #007bff; word-break: break-all;">
                ${resetUrl}
            </p>
            <p>This link is valid for a **limited period** (e.g., 1 hour). Do not share it with anyone.</p>
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

const sendChangeEmailOtp = async (newEmail, otp) => {
	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: newEmail,
		subject: "SHOP.CO: Confirm Your New Email Address",
		html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: auto;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Email Address Change Confirmation</h2>
                
                <p>You recently requested to update your email address associated with your SHOP.CO account to:</p>
                <p style="font-weight: bold; color: #333;">${newEmail}</p>

                <p>To confirm this change and secure your account, please enter the following One-Time Password (OTP):</p>
                
                <p style="font-size: 30px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f4f4f4; border-radius: 5px; text-align: center;">
                    ${otp}
                </p>
                
                <p style="color: #dc3545;"><strong>Security Notice:</strong> This code is valid for a short period. Do not share it with anyone.</p>
                <p>If you did not request to change your email address, please ignore this email or contact customer support immediately to secure your account.</p>
                <p>Thank you,<br/>The SHOP.CO Team</p>
            </div>
        `,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`Change Email OTP sent successfully to: ${newEmail}`);
		return true;
	} catch (error) {
		console.error("Error sending change email OTP:", error);
		throw new Error(
			"Failed to send the confirmation email. Please check the email address and try again."
		);
	}
};

export { sendOtpVerification, sendForgotPasswordToken, sendChangeEmailOtp };
