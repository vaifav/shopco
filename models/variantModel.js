import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
	{
		images: {
			type: [String],
			required: true,
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
				validator: function (v) {
					return v <= this.price;
				},
				message: (props) =>
					`Discounted price (${props.value}) must be less than or equal to the base price.`,
			},
		},
		color: {
			type: String,
			required: true,
			trim: true,
		},
		sizes: {
			type: [String],
			required: true,
		},
		stock: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
			index: true,
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "product",
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

const variantModel = mongoose.model("variant", VariantSchema);

export default variantModel;
