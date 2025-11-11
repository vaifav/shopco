import { v4 as uuid } from "uuid";
import cartModel from "../models/cartModel.js";
import mongoose from "mongoose";
import variantModel from "../models/variantModel.js";

const createCart = async (req, res, userId, data) => {
	const dataObj = {
		count: data.productData.count,
		size: data.productData.size,
		variantId: data.productData.variantId,
	};
	const dataObjWithoutCount = { size: data.productData.size, variantId: data.productData.variantId };
	const updateOptions = { new: true, upsert: true, setDefaultsOnInsert: true };
	const MAX_AGE_MS = 2147483647 * 1000;

	try {
		const variant = await variantModel.findOne({ _id: dataObj.variantId });
		let stockMsg = "";
		if (variant.stock === 0) {
			stockMsg = "Out of Stock....";
		} else if (variant.stock < Number(dataObj.count)) {
			stockMsg = `Only ${variant.stock} items left...`;
		}
		if (variant.stock === 0 || variant.stock < Number(dataObj.count)) throw new Error(stockMsg);

		if (!userId) {
			let guestId = req?.cookies?.guestId;
			if (!guestId) {
				guestId = uuid();

				res.cookie("guestId", guestId, {
					maxAge: MAX_AGE_MS,
					httpOnly: true,
					sameSite: "Lax",
				});
			}

			let cart = await cartModel.findOneAndUpdate(
				{
					guestId,
					items: { $elemMatch: dataObjWithoutCount },
				},
				{
					$inc: { "items.$.count": Number(data.productData.count) },
				},
				{ new: true }
			);

			if (!cart) {
				cart = await cartModel.findOneAndUpdate(
					{ guestId },
					{ $push: { items: dataObj }, $set: { userId: null } },
					updateOptions
				);
			}
			return cart;
		} else {
			let guestId = req?.cookies?.guestId;
			const identifier = guestId ? { guestId } : { userId };

			let cart = await cartModel.findOneAndUpdate(
				{
					...identifier,
					items: { $elemMatch: dataObjWithoutCount },
				},
				{
					$inc: { "items.$.count": Number(data.productData.count) },
					$set: { userId },
				},
				{ new: true }
			);

			if (!cart) {
				cart = await cartModel.findOneAndUpdate(
					{ ...identifier },
					{ $push: { items: dataObj }, $set: { userId: userId } },
					updateOptions
				);
			}
			if (guestId) {
				res.clearCookie("guestId");
			}
			return cart;
		}
	} catch (error) {
		const errorResponse = error.errorResponse;

		if (errorResponse && errorResponse.code === 11000) {
			const targetUserId = userId;
			const guestId = req?.cookies?.guestId;

			if (!guestId) {
				console.error("E11000 without a guestId. Retrying $push without upsert.");
				let cart = await cartModel.findOneAndUpdate(
					{ userId: targetUserId },
					{ $push: { items: dataObj } },
					{ new: true, upsert: false }
				);
				return cart;
			}

			const guestCart = await cartModel.findOne({ guestId });
			const userCart = await cartModel.findOne({ userId: targetUserId });

			if (!guestCart || !userCart) {
				throw new Error("Guest or User cart not found.....");
			}

			const allItems = [dataObj].concat(guestCart.items, userCart.items);
			const mergedItems = {};

			for (const item of allItems) {
				const variantIdString = item.variantId.toString();
				const key = `${variantIdString}-${item.size}`;

				const newItem = {
					count: Number(item.count) || 0,
					size: item.size,
					variantId: item.variantId,
				};

				if (mergedItems[key]) {
					mergedItems[key].count += newItem.count;
				} else {
					mergedItems[key] = newItem;
				}
			}
			const mergedArray = Object.values(mergedItems);

			const updatedCart = await cartModel.findOneAndUpdate(
				{ userId: targetUserId },
				{
					$set: { items: mergedArray },
					$unset: { guestId: 1 },
				},
				{ new: true }
			);

			await cartModel.deleteOne({ guestId });
			res.clearCookie("guestId");

			return updatedCart;
		}

		console.error("Uncaught cart error:", error);
		throw new Error(error.message);
	}
};

const cartDetails = async (req, userId) => {
	const guestId = req?.cookies?.guestId;
	try {
		const pipeline = [
			{
				$unwind: "$items",
			},
			{
				$lookup: {
					from: "variants",
					localField: "items.variantId",
					foreignField: "_id",
					as: "variantDetails",
				},
			},
			{
				$unwind: "$variantDetails",
			},
			{
				$lookup: {
					from: "products",
					localField: "variantDetails.product",
					foreignField: "_id",
					as: "productDetails",
				},
			},
			{
				$unwind: "$productDetails",
			},
			{
				$project: {
					userId: "$userId",
					item: {
						variantId: "$items.variantId",
						size: "$items.size",
						count: "$items.count",
						variant: {
							images: "$variantDetails.images",
							price: "$variantDetails.price",
							discountedPrice: "$variantDetails.discountedPrice",
							color: "$variantDetails.color",
							stock: "$variantDetails.stock",
						},
						product: {
							_id: "$productDetails._id",
							productName: "$productDetails.productName",
							category: "$productDetails.category",
							description: "$productDetails.description",
							rating: "$productDetails.rating",
						},
					},
				},
			},
		];
		if (userId) {
			const cart = await cartModel.aggregate([
				{
					$match: { userId: new mongoose.Types.ObjectId(userId) },
				},
				...pipeline,
			]);
			return cart;
		} else {
			if (!guestId) return [];
			const cart = await cartModel.aggregate([
				{
					$match: { guestId: guestId },
				},
				...pipeline,
			]);
			return cart;
		}
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const deleteCartItem = async (req, userId, variantId, size) => {
	const guestId = req?.cookies?.guestId;
	try {
		if (userId) {
			const cart = await cartModel.updateOne(
				{
					userId,
					items: { $elemMatch: { variantId: new mongoose.Types.ObjectId(variantId), size } },
				},
				{
					$pull: {
						items: {
							variantId: new mongoose.Types.ObjectId(variantId),
							size: size,
						},
					},
				}
			);
			return cart;
		} else {
			if (!guestId) throw new Error("Cart not found....");
			const cart = await cartModel.updateOne(
				{
					guestId,
					items: { $elemMatch: { variantId: new mongoose.Types.ObjectId(variantId), size } },
				},
				{
					$pull: {
						items: {
							variantId: new mongoose.Types.ObjectId(variantId),
							size: size,
						},
					},
				}
			);
			return cart;
		}
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { createCart, cartDetails, deleteCartItem };
