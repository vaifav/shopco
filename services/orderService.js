import OrderModel from "../models/orderModel.js";
import Variant from "../models/variantModel.js";

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
				{ orderStatus: searchRegex },
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
