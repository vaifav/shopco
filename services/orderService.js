import OrderModel from "../models/orderModel.js";
import Variant from "../models/variantModel.js";

const getOrdersByUserId = async (userId) => {
	try {
		const orders = await OrderModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
		return orders;
	} catch (err) {
		console.log(err);
	}
};

const getOrderDetails = async (orderId, userId) => {
	try {
		const order = await OrderModel.findOne({
			_id: orderId,
			user: userId,
		});

		return order;
	} catch (error) {
		console.error("Error fetching order details:", error);
		throw new Error("Could not fetch order details.");
	}
};

const returnStockToInventory = async (items) => {
	const updatePromises = items.map((item) => {
		return Variant.updateOne({ _id: item.variantId }, { $inc: { stock: item.quantity } }).exec();
	});

	await Promise.all(updatePromises);
};

const updateOrderStatus = async (orderId, newStatus) => {
	try {
		const order = await OrderModel.findById(orderId);

		if (!order) {
			const error = new Error("Order not found.");
			error.statusCode = 404;
			throw error;
		}

		if (
			order.orderStatus === "Delivered" ||
			order.orderStatus === "Returned" ||
			order.orderStatus === "Cancelled"
		) {
			const error = new Error(`Order cannot be cancelled because it is already ${order.orderStatus}.`);
			error.statusCode = 400;
			throw error;
		}

		if (newStatus === "Cancelled") {
			await returnStockToInventory(order.items);
		}

		order.orderStatus = newStatus;
		await order.save();

		return order;
	} catch (error) {
		throw new Error(error.message);
	}
};

export { getOrderDetails, getOrdersByUserId ,updateOrderStatus};
