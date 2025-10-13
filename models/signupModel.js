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
		password: {
			type: String,
			minlength: [6, "Password must be at least 6 characters long"],
			select: false,
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
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
	},
	{
		timestamps: true,
	}
);

const userModel = mongoose.model("signup", userSchema);

export default userModel;
