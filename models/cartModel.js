import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			unique: true,
			sparse: true,
		},
		guestId: {
			type: String,
			unique: true,
			sparse: true,
		},
		items: [
			{
				variantId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "variant",
					required: true,
				},
				size: {
					type: String,
					required: true,
				},
				count: {
					type: Number,
					required: true,
					min: 1,
					max: 10,
					default: 1,
				},
			},
			{ _id: false },
		],
	},
	{
		timestamps: true,
	}
);

const cartModel = mongoose.model("cart", cartSchema);

export default cartModel;
