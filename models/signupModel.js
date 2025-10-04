import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fname: { type: String, required: true, trim: true },
		lname: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true },
		password: { type: String, required: true },
		isBlocked: { type: Boolean, default: false },
		role: { type: String, enum: ["user", "admin"], default: "user" },
	},
	{ timestamps: true },
);

const userModel = mongoose.model("signup", userSchema);

export default userModel;
