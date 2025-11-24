import { getAddress, getSingleAddress } from "../../services/addressService.js";
import {
	createBuyNowSnapshot,
	createCartSnapshot,
	createNewOrder,
} from "../../services/checkoutService.js";

import razorPay from "../../config/razorPay.js";
import crypto from "crypto";

const getCheckOutPage = async (req, res) => {
	if (!req.session.checkout || req.session.checkout.cartItems.length === 0) {
		return res.redirect("/cart");
	}

	const checkoutData = req.session.checkout;

	try {
		return res.render("user/checkout", {
			checkout: checkoutData,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).render("user/pagenotfound", { error });
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
		console.log(error);
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
		console.log(error);
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
		console.log("Checkout session incomplete.....");

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
		console.log("Error rendering checkout summary page:", error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const startCartCheckout = async (req, res) => {
	const userId = req.session.user.userId;

	try {
		const snapshotData = await createCartSnapshot(userId);

		req.session.checkout.cartItems = snapshotData.cartItems;
		req.session.checkout.totalAmount = snapshotData.totalAmount;
		req.session.checkout.isFromCart = true;
		req.session.checkout.shippingAddress = null;
		req.session.checkout.paymentMethod = null;

		return res.redirect("/checkout");
	} catch (error) {
		console.log(error.message);
		return res.status(500).redirect(`/cart?error=${encodeURIComponent(error.message)}`);
	}
};

const buyNowAndStartCheckout = async (req, res) => {
	const { productId, variantId, size, color, count } = req.body;
	const quantity = parseInt(count) || 1;

	try {
		const snapshotData = await createBuyNowSnapshot(variantId, size, color, quantity);

		req.session.checkout.cartItems = snapshotData.cartItems;
		req.session.checkout.totalAmount = snapshotData.totalAmount;
		req.session.checkout.isFromCart = false;
		req.session.checkout.shippingAddress = null;
		req.session.checkout.paymentMethod = null;

		return res.redirect("/checkout");
	} catch (error) {
		console.log(error);
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
		console.log("Error saving address snapshot:", error.message);
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
		console.error("Error saving payment method:", error.message);
		return res.status(500).redirect("/checkout/payment");
	}
};

const createRazorpayOrder = async (req, res) => {
	const checkout = req.session.checkout;
	const userId = req.session.user.userId;

	try {
		if (!checkout || !checkout.totalAmount || checkout.totalAmount <= 0) {
			return res.status(400).json({ success: false, message: "Invalid checkout amount." });
		}

		const totalAmountInPaise = Math.round(checkout.totalAmount * 100);

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
		console.error("Error creating Razorpay order:", error);
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
		console.error("Payment Verification/Order Placement Error:", error.message);
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
	const isFromCart = checkout.isFromCart === true;

	try {
		if (
			!checkout ||
			!checkout.shippingAddress ||
			!checkout.paymentMethod ||
			checkout.cartItems.length === 0
		) {
			console.log("Incomplete checkout session......");
			return res.redirect("/cart");
		}

		const newOrder = await createNewOrder(userId, checkout, isFromCart);

		req.session.order = {};
		req.session.order.id = newOrder._id;
		req.session.order.totalAmount = newOrder.totalAmount;
		res.redirect(`/order/success`);
		return;
	} catch (error) {
		console.log(error);
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
		console.error("Wallet Order Placement Error:", error.message);
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
	placeOrder,
	createRazorpayOrder,
	verifyRazorpayPaymentAndPlaceOrder,
	placeWalletOrder,
};
