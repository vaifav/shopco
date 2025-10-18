import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			required: true,
			index: true,
			unique: true,
		},
		fname: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		lname: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 50,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
			maxlength: [10, "Phone number cannot exceed 10 characters"],
			minlength: [10, "Phone number must be at least 10 characters long"],
		},
		avatar: {
			type: String,
			default: "",
			trim: true,
		},
		gender: {
			type: String,
			enum: ["male", "female"],
			required: true,
		},
		address: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "address",
			required: true,
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

const personalInfoModel = mongoose.model("personalInfo", personalInfoSchema);

export default personalInfoModel;
