import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		fullName: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
		country: { type: String, required: true, trim: true },
		state: { type: String, required: true, trim: true },
		city: { type: String, required: true, trim: true },
		street: { type: String, required: true, trim: true },
		houseName: { type: String, required: true, trim: true },
		pin: { type: String, required: true, trim: true },
	},
	{ timestamps: true }
);

const addressModel = mongoose.model("address", addressSchema);

export default addressModel;
