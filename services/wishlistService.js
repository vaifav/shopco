import mongoose from "mongoose";
import wishlistModel from "../models/wishlistModel.js";

const createWishlistItem = async (userId, variantId) => {
	try {
		const update = { $addToSet: { items: variantId } };
		const options = { new: true, upsert: true };

		const wishlist = await wishlistModel.findOneAndUpdate({ userId: userId }, update, options);

		return wishlist;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to add item to wishlist due to database error.");
	}
};

const deleteWishlistItem = async (userId, variantId) => {
	try {
		const update = { $pull: { items: variantId } };
		const options = { new: true };

		const wishlist = await wishlistModel.findOneAndUpdate({ userId: userId }, update, options);

		return wishlist;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to remove item from wishlist due to database error.");
	}
};

const deleteCompleteWishList = async (userId) => {
	try {
		const options = { new: true };
		const wishlist = await wishlistModel.findOneAndUpdate(
			{ userId: userId },
			{ $set: { items: [] } },
			options
		);

		return wishlist;
	} catch (error) {
		console.log(error);
		throw new Error("Failed to remove item from wishlist due to database error.");
	}
};

const getWishListData = async (userId) => {
	try {
		const pipeline = [
			{ $match: { userId: new mongoose.Types.ObjectId(userId) } },
			{ $unwind: "$items" },
			{
				$lookup: {
					from: "variants",
					localField: "items",
					foreignField: "_id",
					as: "variantDetails",
				},
			},
			{ $unwind: "$variantDetails" },
			{
				$lookup: {
					from: "products",
					localField: "variantDetails.product",
					foreignField: "_id",
					as: "productDetails",
				},
			},
			{ $unwind: "$productDetails" },
			{
				$project: {
					_id: 0,
					id: "$_id",
					variantId: "$variantDetails._id",
					productName: "$productDetails.productName",
					productId: "$productDetails._id",
					description: "$productDetails.description",
					price: "$variantDetails.price",
					discountedPrice: "$variantDetails.discountedPrice",
					color: "$variantDetails.color",
					size: { $arrayElemAt: ["$variantDetails.sizes", 0] },
					stock: "$variantDetails.stock",
					image: { $arrayElemAt: ["$variantDetails.images", 0] },
					rating: "$productDetails.rating",
				},
			},
		];

		const wishlist = await wishlistModel.aggregate(pipeline);

		return wishlist;
	} catch (error) {
		console.error("Error fetching populated wishlist:", error);
		throw new Error("Failed to retrieve wishlist data.");
	}
};

export { createWishlistItem, deleteWishlistItem, deleteCompleteWishList, getWishListData };
