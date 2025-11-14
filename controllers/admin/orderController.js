import { getAdminSingleOrderDetails, orderDetails } from "../../services/admin/orderService.js";

async function getAdminOrders(req, res) {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const date = req.query.date || "desc";
	const status = req.query.status || "All";
	const search = req.query.search || "";

	try {
		const orderData = await orderDetails(page, limit, date, status, search);

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
		console.log(error);
	}
}

const getAdminOrderDetailPage = async (req, res) => {
	const { orderId } = req.params;
    console.log(req.para);
    

	try {
		const order = await getAdminSingleOrderDetails(orderId);
		console.log(order);

		if (!order) throw new Error("Order not found");

		return res.render("admin/adminOrderDetail", {
			order: order,
		});
	} catch (error) {
		console.error("Controller Error:");
		return res.status(500).render("user/pagenotfound", { error });
	}
};

export { getAdminOrders ,getAdminOrderDetailPage};
