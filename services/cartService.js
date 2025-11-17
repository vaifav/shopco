import { v4 as uuid } from "uuid";
import cartModel from "../models/cartModel.js";
import mongoose from "mongoose";
import variantModel from "../models/variantModel.js";

const updateOptions = { new: true, upsert: true, setDefaultsOnInsert: true };
const MAX_AGE_MS = 2147483647 * 1000;
const MAX_CART_QTY = 10;

const mergeGuestCartIfPresent = async (req, res, userId) => {
	const guestId = req?.cookies?.guestId;

	if (!guestId) return;

	try {
		const guestCart = await cartModel.findOne({ guestId });
		if (!guestCart) {
			res.clearCookie("guestId");
			return;
		}

		const userCart = await cartModel.findOne({ userId });

		if (!userCart) {
			await cartModel.findOneAndUpdate(
				{ guestId },
				{ $set: { userId: userId }, $unset: { guestId: 1 } }
			);
		} else {
			const allItems = [...guestCart.items, ...userCart.items];
			const mergedItems = {};

			for (const item of allItems) {
				const variantIdString = item.variantId.toString();
				const key = `${variantIdString}-${item.size}`;
				const count = Number(item.count) || 0;

				if (mergedItems[key]) {
					mergedItems[key].count += count;
				} else {
					mergedItems[key] = {
						count: count,
						size: item.size,
						variantId: item.variantId,
					};
				}
			}
			const mergedArray = Object.values(mergedItems);

			await cartModel.updateOne({ userId }, { $set: { items: mergedArray } });
			await cartModel.deleteOne({ guestId });
		}

		res.clearCookie("guestId");
		console.log("Guest cart successfully merged into user cart.");
	} catch (error) {
		console.log(error);
	}
};

const createCart = async (req, res, userId, data) => {
	const dataObj = {
		count: data.productData.count,
		size: data.productData.size,
		variantId: data.productData.variantId,
	};
	const dataObjWithoutCount = { size: data.productData.size, variantId: data.productData.variantId };

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

			let cart = await cartModel.findOne({
				guestId,
				items: { $elemMatch: dataObjWithoutCount },
			});

			if (cart) {
				const existingItem = cart.items.find(
					(item) => item.variantId.toString() === dataObj.variantId && item.size === dataObj.size
				);
				const newTotalCount = (existingItem.count || 0) + Number(data.productData.count);

				if (newTotalCount > MAX_CART_QTY)
					throw new Error(`Cannot add. Maximum quantity is ${MAX_CART_QTY}.`);
				if (newTotalCount > variant.stock)
					throw new Error(`Cannot add. Only ${variant.stock} items left.`);

				cart = await cartModel.findOneAndUpdate(
					{
						guestId,
						items: { $elemMatch: dataObjWithoutCount },
					},
					{
						$inc: { "items.$.count": Number(data.productData.count) },
					},
					{ new: true }
				);
			} else {
				cart = await cartModel.findOneAndUpdate(
					{ guestId },
					{ $push: { items: dataObj }, $set: { userId: null } },
					updateOptions
				);
			}

			return cart;
		} else {
			const identifier = { userId };

			let cart = await cartModel.findOne({
				...identifier,
				items: { $elemMatch: dataObjWithoutCount },
			});

			if (cart) {
				const existingItem = cart.items.find(
					(item) => item.variantId.toString() === dataObj.variantId && item.size === dataObj.size
				);
				const newTotalCount = (existingItem.count || 0) + Number(data.productData.count);

				if (newTotalCount > MAX_CART_QTY)
					throw new Error(`Cannot add. Maximum quantity is ${MAX_CART_QTY}.`);
				if (newTotalCount > variant.stock)
					throw new Error(`Cannot add. Only ${variant.stock} items left.`);

				cart = await cartModel.findOneAndUpdate(
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
			} else {
				cart = await cartModel.findOneAndUpdate(
					{ ...identifier },
					{ $push: { items: dataObj }, $set: { userId: userId } },
					updateOptions
				);
			}

			return cart;
		}
	} catch (error) {
		const errorResponse = error.errorResponse;

		if (errorResponse && errorResponse.code === 11000 && userId) {
			console.log("E11000 error");
			let cart = await cartModel.findOneAndUpdate(
				{ userId: userId },
				{ $push: { items: dataObj } },
				{ new: true, upsert: false }
			);
			return cart;
		}

		console.log(error);
		throw new Error(error.message);
	}
};

const cartDetails = async (req, userId) => {
	const guestId = req?.cookies?.guestId;
	try {
		const pipeline = [
			{ $unwind: "$items" },
			{
				$lookup: {
					from: "variants",
					localField: "items.variantId",
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
				{ $match: { userId: new mongoose.Types.ObjectId(userId) } },
				...pipeline,
			]);
			return cart;
		} else {
			if (!guestId) return [];
			const cart = await cartModel.aggregate([{ $match: { guestId: guestId } }, ...pipeline]);
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

const updateCartItemCount = async (req, userId, variantId, size, newCount) => {
	const guestId = req?.cookies?.guestId;
	const identifier = userId ? { userId } : { guestId };

	if (!userId && !guestId) throw new Error("Cart not found....");
	if (newCount < 1) throw new Error("Quantity cannot be less than 1.");
	if (newCount > MAX_CART_QTY) throw new Error(`Maximum quantity is ${MAX_CART_QTY}.`);

	try {
		const variant = await variantModel.findOne({ _id: variantId });

		if (!variant) throw new Error("Product variant not found.");
		if (newCount > variant.stock) {
			throw new Error(`Only ${variant.stock} items of this variant are in stock.`);
		}

		const cart = await cartModel.findOneAndUpdate(
			{
				...identifier,
				items: { $elemMatch: { variantId: new mongoose.Types.ObjectId(variantId), size } },
			},
			{
				$set: { "items.$.count": newCount },
			},
			{ new: true }
		);

		if (!cart) throw new Error("Cart item not found to update.");

		return cart;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const clearUserCart = async (req, userId) => {
	const guestId = req?.cookies?.guestId;
	const identifier = userId ? { userId } : { guestId };

	if (!userId && !guestId) {
		throw new Error("No cart found to clear.");
	}

	try {
		const result = await cartModel.deleteOne(identifier);

		if (guestId) {
			req.res.clearCookie("guestId");
		}

		if (result.deletedCount === 0) {
			throw new Error("Cart not found or already empty.");
		}

		return result;
	} catch (error) {
		console.error("Error clearing cart:", error);
		throw new Error(error.message);
	}
};

export {
	createCart,
	cartDetails,
	deleteCartItem,
	updateCartItemCount,
	clearUserCart,
	mergeGuestCartIfPresent,
};
