import {
	getOrderDetails,
	getOrdersByUserId,
	updateOrderStatus,
	updateItemStatus,
} from "../../services/orderService.js";
import { getPersonalInfo } from "../../services/personalInfoService.js";

const getOrdersPage = async (req, res) => {
	const userId = req.session.user.userId;

	let page = parseInt(req.query.page) || 1;
	let limit = parseInt(req.query.limit) || 5;
	let search = req.query.search;

	try {
		const personalInfo = await getPersonalInfo(userId);
		const orderData = await getOrdersByUserId(userId, page, limit, search);

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
		return res.status(500).render("user/pagenotfound", { error: error.message });
	}
};

const getOrderDetailPage = async (req, res) => {
	const { orderId } = req.params;
	const userId = req.session.user.userId;

	if (!userId) throw new Error("User Not found");

	try {
		const order = await getOrderDetails(orderId, userId);

		if (!order) throw new Error("Order not found");

		return res.render("user/orderDetail", {
			order: order,
		});
	} catch (error) {
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
		return res.status(500).render("user/pagenotfound", { error });
	}
};

const cancelOrder = async (req, res) => {
	const { orderId } = req.params;
	const { status } = req.body;

	if (status !== "Cancelled") {
		return res.status(400).json({
			success: false,
			message: 'Invalid status provided for cancellation. Must be "Cancelled".',
		});
	}

	try {
		const updatedOrder = await updateOrderStatus(orderId, status);

		return res.status(200).json({
			success: true,
			message: "Order items cancelled, and overall order status updated.",
			orderStatus: updatedOrder.orderStatus,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const cancelItem = async (req, res) => {
	const { orderId, itemId } = req.params;
	const { status } = req.body;

	if (status !== "Cancelled") {
		return res.status(400).json({
			success: false,
			message: 'Invalid status provided for item cancellation. Must be "Cancelled".',
		});
	}

	try {
		const updatedItem = await updateItemStatus(orderId, itemId, status);
		const updatedOrder = await getOrderDetails(orderId, req.session.user.userId);

		return res.status(200).json({
			success: true,
			message: "Item status updated to Cancelled and stock returned.",
			item: updatedItem,
			orderStatus: updatedOrder.orderStatus,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const returnItem = async (req, res) => {
	const { orderId, itemId } = req.params;
	const { status, reason } = req.body;

	if (status !== "Returned") {
		return res.status(400).json({
			success: false,
			message: 'Invalid status provided for item return. Must be "Returned".',
		});
	}

	try {
		const updatedItem = await updateItemStatus(orderId, itemId, status, reason);
		const updatedOrder = await getOrderDetails(orderId, req.session.user.userId);

		return res.status(200).json({
			success: true,
			message: "Item status updated to Returned and refund process initiated.",
			item: updatedItem,
			orderStatus: updatedOrder.orderStatus,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export {
	getOrderDetailPage,
	getOrdersPage,
	getOrderSuccessPage,
	cancelOrder,
	cancelItem,
	returnItem,
};
