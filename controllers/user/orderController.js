import {
	getOrderDetails,
	getOrdersByUserId,
	updateOrderStatus,
} from "../../services/orderService.js";
import { getPersonalInfo } from "../../services/personalInfoService.js";

const getOrdersPage = async (req, res) => {
	const userId = req.session.user.userId;

	let page = parseInt(req.query.page) || 1;
	let limit = parseInt(req.query.limit) || 5;

	try {
		const personalInfo = await getPersonalInfo(userId);
		const orderData = await getOrdersByUserId(userId, page, limit);

		return res.render("user/order", {
			orders: orderData.orders,
			page: orderData.page,
			limit: orderData.limit,
			totalPages: orderData.totalPages,
			totalOrders: orderData.total,
			personalInfo: {
				avatar: personalInfo?.personalInfo?.avatar,
				fname: personalInfo?.personalInfo?.fname,
			},
		});
	} catch (error) {
		console.error("Error fetching user orders:", error.message);
		return res.status(500).render("user/pagenotfound", { error: error.message });
	}
};

const getOrderDetailPage = async (req, res) => {
	const { orderId } = req.params;
	const userId = req.session.user.userId;

	if (!userId) throw new Error("User Not found");

	try {
		const order = await getOrderDetails(orderId, userId);
		console.log(order);

		if (!order) throw new Error("Order not found");

		return res.render("user/orderDetail", {
			order: order,
		});
	} catch (error) {
		console.error(error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const getOrderSuccessPage = async (req, res) => {
	const orderId = req?.session?.order?.id || "";
	const totalAmount = req?.session?.order?.totalAmount || 90;

	try {
		delete req.session.checkout;
		return res.render("user/orderSuccess", { orderId, totalAmount });
	} catch (error) {
		console.error(error.message);
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const cancelOrder = async (req, res, next) => {
	const { orderId } = req.params;

	const { status } = req.body;

	if (status !== "Cancelled") {
		return res.status(400).json({
			message: 'Invalid status provided for cancellation. Must be "Cancelled".',
		});
	}

	try {
		const updatedOrder = await updateOrderStatus(orderId, status);

		res.status(200).json({
			success: true,
			message: "Order status updated to Cancelled and stock returned.",
			order: updatedOrder,
		});
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({
			success: false,
			message: error.message || "An unexpected error occurred during order cancellation.",
		});
	}
};

export { getOrderDetailPage, getOrdersPage, getOrderSuccessPage, cancelOrder };
