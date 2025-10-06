import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, trim: true },
		password: { type: String },
		googleId: { type: String, unique: true, sparse: true },
		isBlocked: { type: Boolean, default: false },
		role: { type: String, enum: ["user", "admin"], default: "user" },
	},
	{ timestamps: true }
);

const userModel = mongoose.model("signup", userSchema);

export default userModel;
