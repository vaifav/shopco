import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		productName: {
			type: String,
			required: true,
			trim: true,
			text: true,
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "category",
			required: true,
			index: true,
		},
		description: {
			type: String,
			required: true,
		},
		targetedAudience: {
			type: [String],
			default: [],
		},
		tags: {
			type: [String],
			default: [],
			index: true,
		},
		rating: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
		},
		style: {
			type: String,
			trim: true,
		},

		variants: {
			type: [mongoose.Types.ObjectId],
			ref: "variant",
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

productSchema.index(
	{
		productName: "text",
		description: "text",
	},
	{
		weights: {
			productName: 3,
			description: 1,
		},
	}
);

const productModel = mongoose.model("product", productSchema);

export default productModel;
