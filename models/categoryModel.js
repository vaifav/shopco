import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema(
	{
		categoryName: {
			type: String,
			required: true,
			trim: true,
			minlength: [2, "Category name must be at least 2 characters"],
			maxlength: [100, "Category name cannot exceed 100 characters"],
			index: true,
		},

		parentCategory: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "category",
			default: null,
		},

		description: {
			type: String,
			trim: true,
			maxlength: [500, "Description cannot exceed 500 characters"],
		},

		categoryImage: {
			type: String,
			trim: true,
			default: "",
		},

		metaTitle: {
			type: String,
			trim: true,
			maxlength: [60, "Meta title cannot exceed 60 characters"],
		},

		metaDescription: {
			type: String,
			trim: true,
			maxlength: [160, "Meta description cannot exceed 160 characters"],
		},

		sortOrder: {
			type: Number,
			default: 0,
			min: [0, "Sort order cannot be negative"],
		},

		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			required: true,
		},

		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
		},

		isBlocked: {
			type: mongoose.Schema.Types.Boolean,
			default: false,
			required: true
		},
	},
	{
		timestamps: true,
	}
);

const categoryModel = mongoose.model("category", categorySchema);

export default categoryModel;
