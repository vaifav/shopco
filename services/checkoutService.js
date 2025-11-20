import mongoose from "mongoose";
import OrderModel from "../models/orderModel.js";
import VariantModel from "../models/variantModel.js";
import CartModel from "../models/cartModel.js";
import userModel from "../models/signupModel.js";
import personalInfoModel from "../models/personalInfoModel.js";

const createBuyNowSnapshot = async (variantId, size, color, quantity) => {
	try {
		if (!variantId || !size || !color || quantity < 1) {
			throw new Error("Invalid product details provided.");
		}

		const variant = await VariantModel.findById(variantId).populate("product");

		if (!variant || variant.product.isBlocked || variant.stock < quantity) {
			throw new Error("Product is unavailable or out of stock.");
		}

		const itemPrice = variant.price;
		const total = itemPrice * quantity;

		const DELIVERY_FEE = 15;
		const finalTotal = total + DELIVERY_FEE;

		const singleItemSnapshot = [
			{
				productId: variant.product._id.toString(),
				variantId: variant._id.toString(),
				name: variant.product.productName,
				price: itemPrice,
				quantity: quantity,
				size: size,
				color: color,
				imageUrl: variant.images[0],
				itemStatus: "Pending",
			},
		];

		return {
			cartItems: singleItemSnapshot,
			totalAmount: finalTotal,
		};
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const createCartSnapshot = async (userId) => {
	if (!userId) {
		throw new Error("User ID is required for cart checkout.");
	}

	try {
		let populatedCartItems = [];
		const cartDocument = await CartModel.findOne({ userId: userId }).populate({
			path: "items.variantId",
			model: "variant",
			populate: {
				path: "product",
				model: "product",
			},
		});

		if (cartDocument) {
			populatedCartItems = cartDocument.items;
		}

		if (populatedCartItems.length === 0) {
			throw new Error("Cart is empty.");
		}

		let subtotal = 0;
		const checkoutItems = [];

		for (const rawItem of populatedCartItems) {
			const variant = rawItem.variantId;
			const product = variant.product;
			const quantity = Number(rawItem.count);

			if (!variant || !product || product.isBlocked || variant.stock < quantity) {
				throw new Error(
					`Item "${product.productName}" is unavailable or out of stock. Please remove or adjust the quantity.`
				);
			}

			const itemPrice = variant.price;
			const itemTotal = itemPrice * quantity;
			subtotal += itemTotal;

			checkoutItems.push({
				productId: product._id.toString(),
				variantId: variant._id.toString(),
				name: product.productName,
				price: itemPrice,
				quantity: quantity,
				size: rawItem.size,
				color: variant.color,
				imageUrl: variant.images[0],
				itemStatus: "Pending",
			});
		}

		const DELIVERY_FEE = 15;
		const finalTotal = subtotal + DELIVERY_FEE;

		return {
			cartItems: checkoutItems,
			totalAmount: finalTotal,
		};
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const createNewOrder = async (userId, checkoutSnapshot, isFromCart) => {
	try {
		const stockUpdatePromises = [];

		for (const item of checkoutSnapshot.cartItems) {
			const variantId = item.variantId;
			const quantity = item.quantity;

			const variant = await VariantModel.findById(variantId);

			if (!variant || variant.stock < quantity) {
				throw new Error(`Insufficient stock for product: ${item.name}.`);
			}

			stockUpdatePromises.push(
				VariantModel.updateOne({ _id: variantId }, { $inc: { stock: -quantity } })
			);
		}

		await Promise.all(stockUpdatePromises);

		const newOrder = new OrderModel({
			user: userId,
			items: checkoutSnapshot.cartItems.map((item) => ({
				productId: item.productId,
				variantId: item.variantId,
				name: item.name,
				price: item.price,
				quantity: item.quantity,
				size: item.size,
				color: item.color,
				imageUrl: item.imageUrl,
				itemStatus: item.itemStatus,
				reason: null,
				refundedAmount: 0,
			})),
			shippingAddress: checkoutSnapshot.shippingAddress,
			paymentMethod: checkoutSnapshot.paymentMethod.method,
			totalAmount: checkoutSnapshot.totalAmount,
		});

		await newOrder.save();

		if (isFromCart) {
			await CartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [] } }, { new: true });
		}

		if ((await OrderModel.countDocuments({ user: new mongoose.Types.ObjectId(userId) })) === 1) {
			await userModel.findByIdAndUpdate(userId, { isVisitors: false });
			const personalInfo = await personalInfoModel.findOne({ userId });

			if (personalInfo && !personalInfo.phone) {
				await personalInfoModel.findOneAndUpdate(
					{ userId },
					{ $set: { phone: checkoutSnapshot.shippingAddress.phone } }
				);
			}

			if (personalInfo && !personalInfo.address) {
				await personalInfoModel.findOneAndUpdate(
					{ userId },
					{ $set: { address: new mongoose.Types.ObjectId(checkoutSnapshot.shippingAddress.addressId) } }
				);
			}
		}

		return newOrder;
	} catch (error) {
		throw new Error(error.message);
	}
};

export { createBuyNowSnapshot, createCartSnapshot, createNewOrder };
