import mongoose from "mongoose";

const { Schema, model } = mongoose;

const variantSchema = new Schema(
	{
		variantId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		images: {
			type: [String],
			default: [],
			validate: [(arr) => arr.length <= 10, "Maximum 10 images allowed"],
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		discountedPrice: {
			type: Number,
			min: 0,
			validate: {
				validator: function (value) {
					return value <= this.price;
				},
				message: "Discounted price cannot be higher than the original price",
			},
		},
		color: {
			type: String,
			trim: true,
		},
		sizes: {
			type: [String],
			default: [],
		},
		stock: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{ _id: false }
);

const productSchema = new Schema(
	{
		productName: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		brand: {
			type: String,
			trim: true,
			index: true,
		},
		category: {
			type: String,
			trim: true,
			index: true,
		},
		description: {
			type: String,
			trim: true,
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
		variants: {
			type: [variantSchema],
			default: [],
		},
		rating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		style: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

productSchema.index({ description: "text", tags: "text" });

const Product = model("Product", productSchema);

export default Product;
