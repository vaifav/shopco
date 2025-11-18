import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			unique: true,
			required: true,
		},
		items: [{ type: mongoose.Schema.Types.ObjectId, ref: "variant" }],
	},
	{
		timestamps: true,
	}
);

const wishlistModel = mongoose.model("wishlist", wishlistSchema);

export default wishlistModel;