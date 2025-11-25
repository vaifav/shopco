import mongoose from "mongoose";
import OrderModel from "../models/orderModel.js";
import VariantModel from "../models/variantModel.js";
import CartModel from "../models/cartModel.js";
import userModel from "../models/signupModel.js";
import personalInfoModel from "../models/personalInfoModel.js";
import WalletTransactionModel from "../models/walletTransactionModel.js";
import { debitWallet } from "./walletService.js";
import CouponModel from "../models/couponModel.js";
import ProductModel from "../models/productModel.js";

const DELIVERY_FEE = 15;

const returnStockToInventory = async (items) => {
	const updatePromises = items.map((item) => {
		return VariantModel.updateOne({ _id: item.variantId }, { $inc: { stock: item.quantity } }).exec();
	});
	await Promise.all(updatePromises);
};

const getValidCoupons = async (userId) => {
	const now = new Date();
	const userIdObj = new mongoose.Types.ObjectId(userId);

	const coupons = await CouponModel.find({
		isActive: true,
		isDeleted: false,
		startDate: { $lte: now },
		expiryDate: { $gte: now },
		$expr: { $lt: ["$usedCount", "$maxGlobalUses"] },
	}).lean();

	const validCoupons = coupons.filter((coupon) => {
		const userUsage = coupon.usersWhoUsed?.find((u) => u.userId.toString() === userIdObj.toString());
		const userUsedCount = userUsage ? userUsage.count : 0;
		return userUsedCount < coupon.maxUsesPerUser;
	});

	return validCoupons.map((coupon) => ({
		code: coupon.code,
		title: coupon.title,
		minPurchaseAmount: coupon.minPurchaseAmount,
		type: coupon.discountType === "fixedAmount" ? "flat" : "percentage",
		value: coupon.discountValue,
		maxDiscount: coupon.maxDiscountAmount,
		restrictionScope: coupon.restrictionScope,
		productRestrictionList: coupon.productRestrictionList.map((id) => id.toString()),
		categoryRestrictionList: coupon.categoryRestrictionList.map((id) => id.toString()),
	}));
};

const getApplicableCouponsForSnapshot = async (cartItems, userId) => {
	const validCoupons = await getValidCoupons(userId);

	const grossItemTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

	const applicableCoupons = validCoupons.filter((coupon) => {
		const { restrictionScope, productRestrictionList, categoryRestrictionList, minPurchaseAmount } =
			coupon;

		if (grossItemTotal < minPurchaseAmount) {
			return false;
		}

		const isApplicableToAnyItem = cartItems.some((item) => {
			const productIdString = item.productId.toString();
			const categoryId = item.categoryId;

			if (restrictionScope === "none") {
				return true;
			} else if (restrictionScope === "includeProducts") {
				return productRestrictionList.includes(productIdString);
			} else if (restrictionScope === "excludeProducts") {
				return !productRestrictionList.includes(productIdString);
			} else if (restrictionScope === "includeCategories") {
				return categoryRestrictionList.includes(categoryId);
			} else if (restrictionScope === "excludeCategories") {
				return !categoryRestrictionList.includes(categoryId);
			}
			return false;
		});

		return isApplicableToAnyItem;
	});

	return applicableCoupons;
};

const applyCouponToSnapshot = async (cartItems, couponCode, userId) => {
	const validCoupons = await getValidCoupons(userId);
	const appliedCoupon = validCoupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase());

	if (!appliedCoupon) {
		throw new Error("Invalid coupon code or coupon is not valid for your account/usage.");
	}

	const {
		restrictionScope,
		productRestrictionList,
		categoryRestrictionList,
		minPurchaseAmount,
		type,
		value,
		maxDiscount,
	} = appliedCoupon;

	let grossItemTotal = 0;
	let grossEligibleTotal = 0;

	const itemsWithEligibility = cartItems.map((item) => {
		const itemTotal = item.price * item.quantity;
		grossItemTotal += itemTotal;

		const productIdString = item.productId.toString();
		const categoryId = item.categoryId;

		let isEligible = false;

		if (restrictionScope === "none") {
			isEligible = true;
		} else if (restrictionScope === "includeProducts") {
			isEligible = productRestrictionList.includes(productIdString);
		} else if (restrictionScope === "excludeProducts") {
			isEligible = !productRestrictionList.includes(productIdString);
		} else if (restrictionScope === "includeCategories") {
			isEligible = categoryRestrictionList.includes(categoryId);
		} else if (restrictionScope === "excludeCategories") {
			isEligible = !categoryRestrictionList.includes(categoryId);
		}

		if (isEligible) {
			grossEligibleTotal += itemTotal;
		}

		return {
			...item,
			isEligible,
			itemTotal,
		};
	});

	if (grossItemTotal < minPurchaseAmount) {
		throw new Error(`Coupon requires a minimum purchase of ₹${minPurchaseAmount.toFixed(2)}.`);
	}

	if (grossEligibleTotal === 0 && restrictionScope !== "none") {
		throw new Error("This coupon is not applicable to any items in your cart.");
	}

	let totalDiscount = 0;
	const discountBase = restrictionScope !== "none" ? grossEligibleTotal : grossItemTotal;

	if (type === "percentage") {
		totalDiscount = discountBase * (value / 100);
		if (maxDiscount && totalDiscount > maxDiscount) {
			totalDiscount = maxDiscount;
		}
	} else if (type === "flat") {
		totalDiscount = value;
	}

	if (totalDiscount > discountBase) {
		totalDiscount = discountBase;
	}

	let totalDiscountDistributed = 0;
	const finalUpdatedItems = itemsWithEligibility.map((item, index) => {
		let itemDiscount = 0;

		if (item.isEligible && grossEligibleTotal > 0) {
			if (index === itemsWithEligibility.length - 1) {
				itemDiscount = totalDiscount - totalDiscountDistributed;
			} else {
				itemDiscount = (item.itemTotal / grossEligibleTotal) * totalDiscount;
			}
		}

		itemDiscount = parseFloat(itemDiscount.toFixed(2));
		totalDiscountDistributed += itemDiscount;

		const finalPrice = item.itemTotal - itemDiscount;

		return {
			productId: item.productId,
			variantId: item.variantId,
			name: item.name,
			price: item.price,
			quantity: item.quantity,
			size: item.size,
			color: item.color,
			imageUrl: item.imageUrl,
			categoryId: item.categoryId,
			couponDiscountAmount: itemDiscount,
			finalPrice: parseFloat(finalPrice.toFixed(2)),
			itemStatus: item.itemStatus,
			itemPaymentStatus: item.itemPaymentStatus,
		};
	});

	const netItemTotal = finalUpdatedItems.reduce((acc, item) => acc + item.finalPrice, 0);
	const finalTotalAmount = netItemTotal + DELIVERY_FEE;
	const finalCalculatedTotalDiscount = grossItemTotal - netItemTotal;

	return {
		updatedItems: finalUpdatedItems,
		netItemTotal: parseFloat(netItemTotal.toFixed(2)),
		totalDiscount: parseFloat(finalCalculatedTotalDiscount.toFixed(2)),
		finalTotalAmount: parseFloat(finalTotalAmount.toFixed(2)),
		appliedCoupon: appliedCoupon,
	};
};

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
		const itemTotal = itemPrice * quantity;
		const categoryId = variant.product.category.toString();

		const grossItemTotal = itemTotal;
		const totalAmount = grossItemTotal;
		const finalTotal = totalAmount + DELIVERY_FEE;

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
				categoryId: categoryId,
				finalPrice: parseFloat(itemTotal.toFixed(2)),
				couponDiscountAmount: 0,
				itemStatus: "Pending",
				itemPaymentStatus: "UNPAID",
			},
		];

		return {
			cartItems: singleItemSnapshot,
			grossItemTotal: parseFloat(grossItemTotal.toFixed(2)),
			totalAmount: parseFloat(totalAmount.toFixed(2)),
			finalTotalAmount: parseFloat(finalTotal.toFixed(2)),
			appliedCoupon: null,
			netItemTotal: parseFloat(totalAmount.toFixed(2)),
		};
	} catch (error) {
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

		let grossItemTotal = 0;
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
			grossItemTotal += itemTotal;

			const categoryId = product.category.toString();

			checkoutItems.push({
				productId: product._id.toString(),
				variantId: variant._id.toString(),
				name: product.productName,
				price: itemPrice,
				quantity: quantity,
				size: rawItem.size,
				color: variant.color,
				imageUrl: variant.images[0],
				categoryId: categoryId,
				finalPrice: parseFloat(itemTotal.toFixed(2)),
				couponDiscountAmount: 0,
				itemStatus: "Pending",
				itemPaymentStatus: "UNPAID",
			});
		}

		const totalAmount = grossItemTotal;
		const finalTotal = totalAmount + DELIVERY_FEE;

		return {
			cartItems: checkoutItems,
			grossItemTotal: parseFloat(grossItemTotal.toFixed(2)),
			totalAmount: parseFloat(totalAmount.toFixed(2)),
			finalTotalAmount: parseFloat(finalTotal.toFixed(2)),
			appliedCoupon: null,
			netItemTotal: parseFloat(totalAmount.toFixed(2)),
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

const createNewOrder = async (userId, checkoutSnapshot, isFromCart, paymentDetails = {}) => {
	let transactionId = null;

	const amountToCharge = checkoutSnapshot.finalTotalAmount;

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

		if (checkoutSnapshot.paymentMethod.method === "WALLET") {
			try {
				transactionId = await debitWallet(
					userId,
					amountToCharge,
					"ORDER",
					new mongoose.Types.ObjectId()
				);

				checkoutSnapshot.cartItems.forEach((item) => {
					item.itemPaymentStatus = "PAID";
					item.itemStatus = "Processing";
				});
			} catch (walletError) {
				await returnStockToInventory(checkoutSnapshot.cartItems);
				throw new Error(`Wallet payment failed: ${walletError.message}`);
			}
		}

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
				finalPrice: item.finalPrice,
				couponDiscountAmount: item.couponDiscountAmount,
				itemStatus: item.itemStatus,
				itemPaymentStatus: item.itemPaymentStatus,
				reason: null,
				refundedAmount: 0,
			})),
			shippingAddress: checkoutSnapshot.shippingAddress,
			paymentMethod: checkoutSnapshot.paymentMethod.method,
			totalAmount: amountToCharge,
			coupon: checkoutSnapshot.appliedCoupon
				? {
						code: checkoutSnapshot.appliedCoupon.code,
						discount: parseFloat(
							(checkoutSnapshot.grossItemTotal - checkoutSnapshot.netItemTotal).toFixed(2)
						),
				  }
				: null,
			razorpayOrderId: paymentDetails.razorPayOrderId || null,
			razorpayPaymentId: paymentDetails.razorPayPaymentId || null,
			walletTransactionId: transactionId,
		});

		await newOrder.save();

		if (checkoutSnapshot.appliedCoupon) {
			const couponCode = checkoutSnapshot.appliedCoupon.code;
			const userIdObj = new mongoose.Types.ObjectId(userId);

			await CouponModel.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });

			const userUsageUpdate = await CouponModel.updateOne(
				{ code: couponCode, "usersWhoUsed.userId": userIdObj },
				{ $inc: { "usersWhoUsed.$.count": 1 } }
			);

			if (userUsageUpdate.modifiedCount === 0) {
				await CouponModel.updateOne(
					{ code: couponCode },
					{ $push: { usersWhoUsed: { userId: userIdObj, count: 1 } } }
				);
			}
		}

		if (transactionId) {
			await WalletTransactionModel.findOneAndUpdate(
				{ externalTransactionId: transactionId },
				{ $set: { referenceId: newOrder._id } }
			);
		}

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
		if (!transactionId) {
			await returnStockToInventory(checkoutSnapshot.cartItems);
		}
		throw new Error(error.message);
	}
};

const refcodeValidation = async (userId, session, couponCode) => {
	try {
		const user = await userModel.findOne({
			$and: [{ refCode: couponCode }, { _id: { $ne: new mongoose.Types.ObjectId(userId) } }],
		});
		const order = await OrderModel.findOne({ user: userId });
		if (!user || (order?.items && order?.items?.length > 0) ) {
			return { success: false, message: "Invalid Coupon..." };
		}
		session.refCode = couponCode;
		return { success: true, message: "Coupon applied successfully! Your wallet has been updated." };
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export {
	createBuyNowSnapshot,
	createCartSnapshot,
	createNewOrder,
	applyCouponToSnapshot,
	getApplicableCouponsForSnapshot,
	refcodeValidation
};
