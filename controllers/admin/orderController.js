import {
	getAdminSingleOrderDetails,
	orderDetails,
	updateOrderItemStatus,
	generateInvoicePdf,
} from "../../services/admin/orderService.js";

async function getAdminOrders(req, res) {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const date = req.query.date || "";
	const status = req.query.status || null;
	const search = req.query.search || "";
	const createdAt = parseInt(req.query.createdAt) || -1;

	try {
		const orderData = await orderDetails(page, limit, date, status, search, createdAt);

		res.render("admin/adminOrder", {
			orders: orderData.data,
			page: orderData.page,
			limit: orderData.limit,
			totalPages: orderData.totalPages,

			totalOrders: orderData.totalOrders,
			deliveredOrders: orderData.deliveredOrders,
			pendingOrders: orderData.pendingOrders,

			currentStatus: status,
			currentSearch: search,
			currentDateSort: date,
		});
	} catch (error) {
		console.error("Controller Error (getAdminOrders):", error);
		res.status(500).send("Failed to load orders.");
	}
}

const getAdminOrderDetailPage = async (req, res) => {
	const { orderId } = req.params;

	try {
		const order = await getAdminSingleOrderDetails(orderId);

		if (!order) throw new Error("Order not found");

		return res.render("admin/adminOrderDetail", {
			order: order,
		});
	} catch (error) {
		console.error("Controller Error (getAdminOrderDetailPage):", error);
		return res.status(404).render("user/pagenotfound", { error });
	}
};

const updateAdminOrderItemStatus = async (req, res) => {
	const { orderId, itemId } = req.params;

	const { newStatus } = req.body;

	if (!newStatus || !orderId || !itemId) {
		return res.status(400).json({
			success: false,
			message: "Missing Order ID, Item ID, or new Status.",
		});
	}

	try {
		const result = await updateOrderItemStatus(orderId, itemId, newStatus);
		return res.status(200).json({
			success: true,
			message: `Order item status updated to ${result.newItemStatus}. Overall order status is now ${result.newOverallStatus}.`,
			newItemStatus: result.newItemStatus,
			newOverallStatus: result.newOverallStatus,
		});
	} catch (error) {
		console.error("(updateAdminOrderItemStatus):", error.message);
		return res.status(500).json({
			success: false,
			message: error.message || "Internal server error. Failed to update item status.",
		});
	}
};

const downloadOrderInvoice = async (req, res) => {
	const { orderId } = req.params;

	if (!orderId) {
		return res.status(400).send("Invalid Order ID not found.");
	}

	try {
		await generateInvoicePdf(orderId, res);
	} catch (error) {
		if (!res.headersSent) {
			res.status(error.statusCode || 500).send("Failed to process invoice request.");
		}
	}
};

export {
	getAdminOrders,
	getAdminOrderDetailPage,
	updateAdminOrderItemStatus,
	downloadOrderInvoice,
};
