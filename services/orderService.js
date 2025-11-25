import OrderModel from "../models/orderModel.js";
import Variant from "../models/variantModel.js";
import { creditWallet } from "./walletService.js";

const determineOrderStatus = (items) => {
	if (!items || items.length === 0) return "Pending";

	const statuses = items.map((item) => item.itemStatus);

	const isClosed = statuses.every((s) => ["Cancelled", "Returned"].includes(s));
	if (isClosed) {
		if (statuses.every((s) => s === "Returned")) return "Completed (with Return)";
		return "Closed";
	}

	const isPartialStatus = statuses.some((s) => s === "Cancelled" || s === "Returned");
	const isDelivered = statuses.some((s) => s === "Delivered");
	const isShipped = statuses.some((s) => s === "Shipped");
	const isProcessing = statuses.some((s) => s === "Processing");
	const isPending = statuses.some((s) => s === "Pending");

	if (statuses.every((s) => s === "Delivered")) return "Completed";

	if (isDelivered) {
		return isPartialStatus ? "Partial Delivered" : "Delivered";
	}
	if (isShipped) {
		return isPartialStatus ? "Partial Shipped" : "Shipped";
	}
	if (isProcessing) {
		return isPartialStatus ? "Partial Processing" : "Processing";
	}

	if (isPending) {
		return isPartialStatus ? "Partial Pending" : "Pending";
	}

	return "Pending";
};

const getOrdersByUserId = async (userId, page = 1, limit = 5, search) => {
	try {
		let query = { user: userId };
		let total = 0;

		if (search) {
			const searchRegex = new RegExp(search, "i");
			const searchCriteria = [
				{ "items.name": searchRegex },
				{ "items.color": searchRegex },
				{ paymentMethod: searchRegex },
			];
			const searchNumber = parseFloat(search);
			if (!isNaN(searchNumber)) {
				searchCriteria.push({ totalAmount: searchNumber });
			}

			query = {
				user: userId,
				$or: searchCriteria,
			};
		}

		total = await OrderModel.countDocuments(query);
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;
		if (total === 0) {
			return { orders: [], page, limit, totalPages: 1, total: 0 };
		}

		const orders = await OrderModel.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		orders.forEach((order) => {
			order.orderStatus = determineOrderStatus(order.items);
		});

		return {
			orders,
			page,
			limit,
			totalPages,
			total,
		};
	} catch (err) {
		throw new Error("Failed to fetch user orders.");
	}
};

const getOrderDetails = async (orderId, userId) => {
	try {
		const order = await OrderModel.findOne({
			_id: orderId,
			user: userId,
		});

		if (order) {
			order.orderStatus = determineOrderStatus(order.items);
		}

		return order;
	} catch (error) {
		throw new Error("Could not fetch order details.");
	}
};

const returnStockToInventory = async (items) => {
	const updatePromises = items.map((item) => {
		return Variant.updateOne({ _id: item.variantId }, { $inc: { stock: item.quantity } }).exec();
	});

	await Promise.all(updatePromises);
};

const updateItemStatus = async (orderId, itemId, newStatus, reason = null) => {
	try {
		const order = await OrderModel.findById(orderId);
		if (!order) throw new Error("Order not found.");

		const item = order.items.id(itemId);
		if (!item) throw new Error("Item not found in order.");

		const currentStatus = item.itemStatus;
		const closedStatuses = ["Returned", "Cancelled"];
		const isOnlinePayment = order.paymentMethod !== "COD";

		if (closedStatuses.includes(currentStatus)) {
			throw new Error(`Item cannot be modified because it is already ${currentStatus}.`);
		}

		let refundAmount = 0;

		switch (newStatus) {
			case "Cancelled":
				if (currentStatus === "Delivered") {
					throw new Error(`Cannot cancel a Delivered item. Please initiate a return.`);
				}

				await returnStockToInventory([item]);
				item.reason = "Item Cancellation";
				if (isOnlinePayment) {
					if (item.couponDiscountAmount && item.couponDiscountAmount > 0) {
						refundAmount = (item.price - item.couponDiscountAmount) * item.quantity;
					} else {
						refundAmount = item.price * item.quantity;
					}
				} else {
					refundAmount = 0;
				}

				break;

			case "Returned":
				if (currentStatus !== "Delivered") {
					throw new Error(`Item must be Delivered before it can be returned.`);
				}
				if (!reason) {
					throw new Error("A reason is required to process an item return.");
				}

				await returnStockToInventory([item]);
				item.reason = reason;
				refundAmount = item.price * item.quantity;
				break;

			default:
				throw new Error(`Invalid status transition to ${newStatus}.`);
		}

		if (isOnlinePayment && refundAmount > 0) {
			const userId = order.user;

			try {
				const transactionId = await creditWallet(userId, refundAmount, "REFUND", orderId);

				item.itemPaymentStatus = "REFUNDED";
				item.refundTransactionId = transactionId;
				order.totalRefundedAmount += refundAmount;
			} catch (e) {
				item.itemPaymentStatus = "REFUND_FAILED";
				item.refundFailureReason = "Wallet credit failed: " + e.message;
				refundAmount = 0;
				throw new Error(`Refund to wallet failed. Item set to REFUND_FAILED.`);
			}
		}

		item.refundedAmount = refundAmount;
		item.itemStatus = newStatus;

		await order.save();
		return item;
	} catch (error) {
		throw new Error(error.message);
	}
};

const updateOrderStatus = async (orderId, newStatus) => {
	try {
		const order = await OrderModel.findById(orderId);
		if (!order) throw new Error("Order not found.");

		if (newStatus !== "Cancelled") {
			throw new Error(
				`Invalid status transition to ${newStatus}. This function only supports full order 'Cancelled' status.`
			);
		}

		const itemsToCancel = order.items.filter(
			(item) => !["Cancelled", "Returned", "Delivered"].includes(item.itemStatus)
		);

		if (itemsToCancel.length === 0) throw new Error("No cancellable items found in this order.");

		await returnStockToInventory(itemsToCancel);
		const isOnlinePayment = order.paymentMethod !== "COD";
		let totalRefundAmount = 0;

		itemsToCancel.forEach((item) => {
			// const itemRefund = isOnlinePayment ? item.price * item.quantity : 0;

			let itemRefund = 0;
			if (isOnlinePayment) {
				if (item.couponDiscountAmount && item.couponDiscountAmount > 0) {
					itemRefund = (item.price - item.couponDiscountAmount) * item.quantity;
				} else {
					itemRefund = item.price * item.quantity;
				}
			} else {
				itemRefund = 0;
			}
			item.itemStatus = "Cancelled";
			item.reason = "Full Order Cancellation";
			item.refundedAmount = itemRefund;
			totalRefundAmount += itemRefund;
		});

		if (isOnlinePayment && totalRefundAmount > 0) {
			const userId = order.user;

			try {
				const walletTransactionId = await creditWallet(userId, totalRefundAmount, "REFUND", orderId);

				itemsToCancel.forEach((item) => {
					item.itemPaymentStatus = "REFUNDED";
					item.refundTransactionId = walletTransactionId;
				});

				order.totalRefundedAmount += totalRefundAmount;
			} catch (e) {
				itemsToCancel.forEach((item) => {
					item.itemPaymentStatus = "REFUND_FAILED";
					item.refundFailureReason = "Wallet credit failed: " + e.message;
					item.refundedAmount = 0;
				});
				throw new Error(`Full refund to wallet failed. Order items set to REFUND_FAILED.`);
			}
		}

		await order.save();
		order.orderStatus = determineOrderStatus(order.items);
		return order;
	} catch (error) {
		throw new Error(error.message);
	}
};

export { getOrderDetails, getOrdersByUserId, updateOrderStatus, updateItemStatus };
