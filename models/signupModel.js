import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
		},
		tempEmail: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
		},
		username: {
			type: String,
			trim: true,
		},
		password: {
			type: String,
			minlength: [6, "Password must be at least 6 characters long"]
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true,
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		isVisitors: {
			type: Boolean,
			default: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		otp: {
			type: String,
		},
		otpExpires: {
			type: Date,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		changePasswordToken: {
			type: String,
		},
		changePasswordTokenExpires: {
			type: Date,
		},
		changeEmailOtp: {
			type: String,
		},
		changeEmailOtpExpires: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

const userModel = mongoose.model("signup", userSchema);

export default userModel;
