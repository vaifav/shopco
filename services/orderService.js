import OrderModel from "../models/orderModel.js";
import Variant from "../models/variantModel.js";

const getOrdersByUserId = async (userId, page = 1, limit = 5) => {
	try {
		const total = await OrderModel.countDocuments({ user: userId });
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const orders = await OrderModel.find({ user: userId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		return {
			orders,
			page,
			limit,
			totalPages,
			total,
		};
	} catch (err) {
		console.log(err);
		throw new Error("Failed to fetch user orders.");
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

export { getOrderDetails, getOrdersByUserId, updateOrderStatus };
