import { getAddress, getSingleAddress } from "../../services/addressService.js";
import {
	createBuyNowSnapshot,
	createCartSnapshot,
	createNewOrder,
	applyCouponToSnapshot,
	getApplicableCouponsForSnapshot,
	refcodeValidation,
} from "../../services/checkoutService.js";

import razorPay from "../../config/razorPay.js";
import crypto from "crypto";
import { creditWallet } from "../../services/walletService.js";
import userModel from "../../models/signupModel.js";

const getCheckOutPage = async (req, res) => {
	if (!req.session.checkout || req.session.checkout.cartItems.length === 0) {
		return res.redirect("/cart");
	}

	const userId = req.session.user.userId;
	const checkoutData = req.session.checkout;
	const errorMessage = req.query.error || null;
	const successMessage = req.query.message || null;

	try {
		const applicableCoupons = await getApplicableCouponsForSnapshot(checkoutData.cartItems, userId);

		return res.render("user/checkout", {
			checkout: checkoutData,
			error: errorMessage,
			message: successMessage,
			applicableCoupons: applicableCoupons,
		});
	} catch (error) {
		return res.status(500).render("user/pagenotfound", { error: error.message });
	}
};

const getCheckOutAddressPage = async (req, res) => {
	try {
		const userId = req.session.user.userId;
		const checkoutData = req.session.checkout;

		const address = await getAddress(userId);

		if (!checkoutData || checkoutData.cartItems.length === 0) {
			return res.redirect("/cart");
		}

		return res.render("user/checkoutAddress", {
			address,
			checkout: checkoutData,
		});
	} catch (error) {
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const getCheckoutPaymentPage = async (req, res) => {
	const checkoutData = req.session.checkout;

	if (!checkoutData || checkoutData.cartItems.length === 0) {
		return res.redirect("/cart");
	}
	if (!checkoutData.shippingAddress) {
		return res.redirect("/checkout/address");
	}

	try {
		return res.render("user/checkoutPayment", {
			checkout: checkoutData,
		});
	} catch (error) {
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const getCheckoutSummaryPage = async (req, res) => {
	const checkoutData = req.session.checkout;

	if (
		!checkoutData ||
		checkoutData.cartItems.length === 0 ||
		!checkoutData.shippingAddress ||
		!checkoutData.paymentMethod
	) {
		if (!checkoutData || checkoutData.cartItems.length === 0) return res.redirect("/cart");
		if (!checkoutData.shippingAddress) return res.redirect("/checkout/address");
		if (!checkoutData.paymentMethod) return res.redirect("/checkout/payment");
	}

	try {
		return res.render("user/checkoutSummary", {
			checkout: checkoutData,
			razorpayKeyId: process.env.RAZORPAY_KEY,
		});
	} catch (error) {
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const startCartCheckout = async (req, res) => {
	const userId = req.session.user.userId;

	try {
		const snapshotData = await createCartSnapshot(userId);

		req.session.checkout = {
			...snapshotData,
			isFromCart: true,
			shippingAddress: null,
			paymentMethod: null,
		};

		return res.redirect("/checkout");
	} catch (error) {
		return res.status(500).redirect(`/cart?error=${encodeURIComponent(error.message)}`);
	}
};

const buyNowAndStartCheckout = async (req, res) => {
	const { productId, variantId, size, color, count } = req.body;
	const quantity = parseInt(count) || 1;

	try {
		const snapshotData = await createBuyNowSnapshot(variantId, size, color, quantity);

		req.session.checkout = {
			...snapshotData,
			isFromCart: false,
			shippingAddress: null,
			paymentMethod: null,
		};

		return res.redirect("/checkout");
	} catch (error) {
		return res
			.status(500)
			.redirect(
				`/products/${productId.toString()}/${variantId.toString()}?error=${encodeURIComponent(
					error.message
				)}`
			);
	}
};

const saveShippingAddressSnapshot = async (req, res) => {
	const { addressId } = req.body;
	const userId = req.session.user.userId;

	if (!req.session.checkout || req.session.checkout.cartItems.length === 0) {
		return res.redirect("/cart");
	}

	if (!addressId) {
		return res.status(400).redirect("/checkout/address");
	}

	try {
		const address = await getSingleAddress(addressId, userId);

		const addressSnapshot = {
			fullName: address.fullName,
			phone: address.phone,
			houseName: address.houseName,
			street: address.street,
			city: address.city,
			state: address.state,
			country: address.country,
			pin: address.pin,
			addressId: addressId,
		};

		req.session.checkout.shippingAddress = addressSnapshot;

		return res.redirect("/checkout/payment");
	} catch (error) {
		return res.status(400).redirect("/checkout/address");
	}
};

const savePaymentMethodAndRedirect = async (req, res) => {
	const { paymentMethod } = req.body;

	if (!req.session.checkout || !req.session.checkout.shippingAddress) {
		return res.redirect("/checkout/address");
	}

	if (!paymentMethod) {
		return res.status(400).redirect("/checkout/payment");
	}

	try {
		const paymentSnapshot = {
			method: paymentMethod,
		};

		req.session.checkout.paymentMethod = paymentSnapshot;

		return res.redirect("/checkout/summary");
	} catch (error) {
		return res.status(500).redirect("/checkout/payment");
	}
};

const applyCoupon = async (req, res) => {
	const { couponCode } = req.body;
	const userId = req.session.user.userId;
	const checkoutSnapshot = req.session.checkout;

	if (!checkoutSnapshot || checkoutSnapshot.cartItems.length === 0) {
		return res.status(400).json({ success: false, message: "Cart is empty or session expired." });
	}

	if (couponCode.startsWith("REFCODE_")) {
		const response = await refcodeValidation(req.session.user.userId, req.session, couponCode);
		return res.json(response);
	}

	try {
		const result = await applyCouponToSnapshot(checkoutSnapshot.cartItems, couponCode, userId);

		req.session.checkout = {
			...checkoutSnapshot,
			cartItems: result.updatedItems,
			totalAmount: result.netItemTotal,
			finalTotalAmount: result.finalTotalAmount,
			netItemTotal: result.netItemTotal,
			appliedCoupon: result.appliedCoupon,
		};

		return res
			.status(200)
			.json({ success: true, message: "Coupon applied successfully! Your total has been updated." });
	} catch (error) {
		return res.status(400).json({ success: false, message: error.message });
	}
};

const removeCoupon = async (req, res) => {
	const userId = req.session.user.userId;
	const checkoutSnapshot = req.session.checkout;

	if (!checkoutSnapshot || checkoutSnapshot.cartItems.length === 0) {
		return res.status(400).json({ success: false, message: "Cart is empty or session expired." });
	}

	try {
		let freshSnapshot;
		if (checkoutSnapshot.isFromCart) {
			freshSnapshot = await createCartSnapshot(userId);
		} else {
			const item = checkoutSnapshot.cartItems[0];
			freshSnapshot = await createBuyNowSnapshot(item.variantId, item.size, item.color, item.quantity);
		}

		req.session.checkout = {
			...checkoutSnapshot,
			...freshSnapshot,
		};

		return res
			.status(200)
			.json({ success: true, message: "Coupon removed. Total reset successfully." });
	} catch (error) {
		return res.status(400).json({ success: false, message: error.message });
	}
};

const createRazorpayOrder = async (req, res) => {
	const checkout = req.session.checkout;
	const userId = req.session.user.userId;

	try {
		if (!checkout || !checkout.finalTotalAmount || checkout.finalTotalAmount <= 0) {
			return res.status(400).json({ success: false, message: "Invalid checkout amount." });
		}

		const totalAmountInPaise = Math.round(checkout.finalTotalAmount * 100);

		const options = {
			amount: totalAmountInPaise,
			currency: "INR",
			receipt: `order_rcpt_${Date.now()}_${userId.toString().slice(-2)}`,
			payment_capture: 1,
		};

		const razorpayOrder = await razorPay.orders.create(options);

		req.session.razorpay = {
			orderId: razorpayOrder.id,
			totalAmount: totalAmountInPaise,
		};

		return res.status(200).json({
			success: true,
			message: "Success",
			order: razorpayOrder,
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: "Failed to initiate online payment." });
	}
};

const verifyRazorpayPaymentAndPlaceOrder = async (req, res) => {
	const { razorPayOrderId, razorPayPaymentId, razorPaySignature } = req.body;

	const checkout = req.session.checkout;
	const userId = req.session.user.userId;
	const isFromCart = checkout.isFromCart === true;

	try {
		if (!checkout || !req.session.razorpay || req.session.razorpay.orderId !== razorPayOrderId) {
			throw new Error("Invalid session or order ID mismatch.");
		}

		const generatedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_SECRET)
			.update(razorPayOrderId + "|" + razorPayPaymentId)
			.digest("hex");

		if (generatedSignature !== razorPaySignature) {
			throw new Error("Payment signature verification failed.");
		}

		const checkoutWithPaymentSuccess = {
			...checkout,
			cartItems: checkout.cartItems.map((item) => ({
				...item,
				itemStatus: "Processing",
				itemPaymentStatus: "PAID",
			})),
		};

		const paymentDetails = {
			razorPayOrderId,
			razorPayPaymentId,
		};

		const newOrder = await createNewOrder(
			userId,
			checkoutWithPaymentSuccess,
			isFromCart,
			paymentDetails
		);

		delete req.session.razorpay;
		req.session.order = {};
		req.session.order.id = newOrder._id;
		req.session.order.totalAmount = newOrder.totalAmount;

		return res.status(200).json({
			success: true,
			message: "Payment successful and Order Placed",
			orderId: newOrder._id,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Order placement failed after payment verification.",
			error: error.message,
		});
	}
};

const placeOrder = async (req, res) => {
	const checkout = req.session.checkout;
	const userId = req.session.user.userId;
	const refCode = req.session.refCode;
	const isFromCart = checkout.isFromCart === true;

	try {
		if (
			!checkout ||
			!checkout.shippingAddress ||
			!checkout.paymentMethod ||
			checkout.cartItems.length === 0
		) {
			return res.redirect("/cart");
		}

		const newOrder = await createNewOrder(userId, checkout, isFromCart);
		if (refCode) {
			const user = await userModel.findOne({ refCode });
			if (!user) throw new Error("user not found");

			await creditWallet(userId, 20, "BONUS", newOrder._id);
			await creditWallet(user._id, 20, "BONUS", user._id);
		}

		req.session.order = {};
		req.session.order.id = newOrder._id;
		req.session.order.totalAmount = newOrder.totalAmount;
		res.redirect(`/order/success`);
		return;
	} catch (error) {
		return res.status(500).redirect(`/checkout/summary?error=${encodeURIComponent(error.message)}`);
	}
};

const placeWalletOrder = async (req, res) => {
	const checkout = req.session.checkout;
	const userId = req.session.user.userId;
	const isFromCart = checkout.isFromCart === true;

	try {
		if (
			!checkout ||
			!checkout.shippingAddress ||
			!checkout.paymentMethod ||
			checkout.cartItems.length === 0 ||
			checkout.paymentMethod.method !== "WALLET"
		) {
			throw new Error("Invalid or incomplete checkout session for Wallet payment.");
		}

		checkout.paymentMethod.method = "WALLET";

		const newOrder = await createNewOrder(userId, checkout, isFromCart);

		req.session.order = {
			id: newOrder._id,
			totalAmount: newOrder.totalAmount,
		};

		return res.status(200).json({
			success: true,
			message: "Wallet payment successful and Order Placed",
			orderId: newOrder._id,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message || "Failed to place order using Wallet.",
		});
	}
};

export {
	getCheckOutPage,
	getCheckOutAddressPage,
	getCheckoutPaymentPage,
	getCheckoutSummaryPage,
	startCartCheckout,
	buyNowAndStartCheckout,
	saveShippingAddressSnapshot,
	savePaymentMethodAndRedirect,
	applyCoupon,
	removeCoupon,
	placeOrder,
	createRazorpayOrder,
	verifyRazorpayPaymentAndPlaceOrder,
	placeWalletOrder,
};
