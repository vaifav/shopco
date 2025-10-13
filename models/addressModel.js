import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			required: true,
			index: true,
		},
		fullName: {
			type: String,
			required: [true, "Full name is required"],
			trim: true,
			maxlength: 100,
		},
		phone: {
			type: String,
			required: [true, "Phone number is required"],
			trim: true,
			match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
			maxlength: [10, "Phone number cannot exceed 10 characters"],
			minlength: [10, "Phone number must be at least 10 characters long"],
		},
		country: {
			type: String,
			required: [true, "Country is required"],
			trim: true,
		},
		state: {
			type: String,
			required: [true, "State is required"],
			trim: true,
		},
		city: {
			type: String,
			required: [true, "City is required"],
			trim: true,
		},
		street: {
			type: String,
			required: [true, "Street is required"],
			trim: true,
		},
		houseName: {
			type: String,
			required: [true, "House name is required"],
			trim: true,
		},
		pin: {
			type: String,
			required: [true, "PIN/ZIP code is required"],
			trim: true,
			match: [/^[0-9]{4,10}$/, "Please enter a valid PIN/ZIP code"],
		},
	},
	{
		timestamps: true,
	}
);

const addressModel = mongoose.model("address", addressSchema);

export default addressModel;
