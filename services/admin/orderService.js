import OrderModel from "../../models/orderModel.js";

async function orderDetails(page = 1, limit = 10, date, status, search = "") {
	const data = {};
	const query = {};
	const sortCriteria = {};

	const sortValue = date === "asc" ? 1 : -1;
	sortCriteria["createdAt"] = sortValue;

	if (status && status.trim() !== "" && status.toLowerCase() !== "all") {
		query.orderStatus = status;
	}

	if (search && search.trim() !== "") {
		const regex = new RegExp(search, "i");
		query._id = { $regex: regex };
	}

	try {
		const total = await OrderModel.countDocuments(query);
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const orders = await OrderModel.find(query)

			.populate({ path: "user", select: "username email" })
			.sort(sortCriteria)
			.skip(skip)
			.limit(limit)
			.lean();

		data.total = total;
		data.page = page;
		data.limit = limit;
		data.totalPages = totalPages;

		data.totalOrders = await OrderModel.countDocuments();
		data.deliveredOrders = await OrderModel.countDocuments({ orderStatus: "Delivered" });
		data.pendingOrders = await OrderModel.countDocuments({ orderStatus: "Pending" });

		data.data = orders.map((order) => {
			const customerIdentifier = order.user.username || order.user.email;
			return {
				id: order._id,
				customerName: order.user ? customerIdentifier : "Guest User",
				date: order.createdAt,
				totalAmount: order.totalAmount,
				orderStatus: order.orderStatus,
				paymentMethod: order.paymentMethod,
			};
		});

		return data;
	} catch (error) {
		console.error("Error fetching admin order details:", error);
		throw new Error("Failed to fetch order details.");
	}
}

const getAdminSingleOrderDetails = async (orderId) => {
	try {
		const order = await OrderModel.findOne({
			_id: orderId,
		});

		return order;
	} catch (error) {
		console.error("Error fetching order details:", error);
		throw new Error("Could not fetch order details.");
	}
};

export { orderDetails, getAdminSingleOrderDetails };
