import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import OrderModel from "../../models/orderModel.js";
import userModel from "../../models/signupModel.js";

async function orderDetails(page = 1, limit = 10, date, status, search = "", createdAt = -1) {
	const data = {};
	const query = {};

	if (status && status.trim() !== "") {
		query.orderStatus = status;
	}

	if (date && date.trim() !== "") {
		const startDate = new Date(date);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(startDate);
		endDate.setUTCDate(startDate.getUTCDate() + 1);
		query.createdAt = {
			$gte: startDate,
			$lt: endDate,
		};
	}

	if (search && search.trim() !== "") {
		const trimmedSearch = search.trim();
		const regex = new RegExp(trimmedSearch, "i");
		const searchConditions = [];
		const matchingUsers = await userModel
			.find({
				$or: [{ username: { $regex: regex } }, { email: { $regex: regex } }],
			})
			.select("_id")
			.lean();

		const userIds = matchingUsers.map((user) => user._id);

		if (userIds.length > 0) {
			searchConditions.push({ user: { $in: userIds } });
		}

		if (mongoose.Types.ObjectId.isValid(trimmedSearch)) {
			searchConditions.push({ _id: trimmedSearch });
		}

		if (searchConditions.length > 0) {
			query.$or = searchConditions;
		} else {
			query._id = null;
		}
	}

	try {
		const total = await OrderModel.countDocuments(query);
		const totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const orders = await OrderModel.find(query)
			.sort({ createdAt })
			.populate({ path: "user", select: "username email" })
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
			const customerIdentifier = order?.user?.username || order?.user?.email;
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

const updateOrderStatus = async (orderId, newStatus) => {
	const validTransitions = {
		Pending: ["Processing", "Cancelled"],
		Processing: ["Shipped", "Cancelled"],
		Shipped: ["Delivered", "Returned"],
		Delivered: ["Returned"],
		Cancelled: [],
		Returned: [],
	};

	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		throw new Error(`Invalid Order ID format: ${orderId}`);
	}

	try {
		const validStatuses = Object.keys(validTransitions);
		if (!validStatuses.includes(newStatus)) {
			throw new Error(
				`Invalid order status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`
			);
		}

		const order = await OrderModel.findOne({ _id: orderId });

		const checkStatus = validTransitions[order.orderStatus];
		if (!checkStatus || !checkStatus.includes(newStatus)) {
			const errorMsg =
				checkStatus.length === 0
					? `The order is already ${order.orderStatus}`
					: `Only ${checkStatus} is allowed.....`;
			throw new Error(errorMsg);
		}

		const updatedOrder = await OrderModel.findByIdAndUpdate(
			orderId,
			{ orderStatus: newStatus },
			{ new: true }
		);

		if (!updatedOrder) {
			throw new Error(`Order ID not found.`);
		}

		return { success: true, newStatus: updatedOrder.orderStatus };
	} catch (error) {
		console.error("Error updating order status:", error);
		throw new Error(error.message || "Failed to update order status in database.");
	}
};

async function generateInvoicePdf(orderId, res) {
	try {
		const order = await OrderModel.findById(orderId)
			.populate({ path: "user", select: "username email phone" })
			.lean();

		if (!order) {
			const error = new Error("Order not found.");
			error.statusCode = 404;
			throw error;
		}

		const doc = new PDFDocument({ margin: 50 });
		const startX = 50;
		const endX = 550;

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=invoice_${orderId}.pdf`);

		doc.pipe(res);

		doc.fontSize(25).text("INVOICE", { align: "center" });
		doc.moveDown(0.5);

		doc.fontSize(10);
		doc.text(`Order ID: ${order._id}`, startX, doc.y, { continued: true, width: 300 });
		doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, endX - 100, doc.y);
		doc.moveDown(1.5);

		doc.fontSize(12).text("BILLING & SHIPPING:", { underline: true });
		doc.moveDown(0.5);

		doc.fontSize(10);
		doc.text(`Customer: ${order.shippingAddress.fullName}`);
		doc.text(
			`Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pin}`
		);
		doc.moveDown(2);

		doc.fontSize(12).text("ORDER ITEMS:", { underline: true });
		doc.moveDown(0.7);

		order.items.forEach((item, index) => {
			const itemTotal = item.price * item.quantity;

			doc.fontSize(10);

			doc.text(`Item: ${item.name} (${item.size ? item.size.toUpperCase() : "N/A"})`, startX);
			doc.text(`Quantity: ${item.quantity}`, startX);
			doc.text(`Unit Price: ₹${item.price.toFixed(2)}`, startX);
			doc.text(`Total: ₹${itemTotal.toFixed(2)}`, startX);

			doc.moveDown(1);

			if (index < order.items.length - 1) {
				doc
					.lineWidth(0.5)
					.dash(2, { space: 2 })
					.moveTo(startX, doc.y - 5)
					.lineTo(endX, doc.y - 5)
					.stroke();
				doc.undash();
				doc.moveDown(1);
			}
		});
		doc.text(`Status: ₹${order.orderStatus}`, startX);
		doc.moveDown(1);

		const itemsSubtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
		const totalColPos = 400;

		doc
			.fontSize(12)
			.text(`Subtotal:`, totalColPos, doc.y, { continued: true, width: 100, align: "right" });
		doc.text(`₹${itemsSubtotal.toFixed(2)}`, endX - 50, doc.y, { align: "right" });
		doc.moveDown(0.5);

		doc
			.fontSize(14)
			.text(`GRAND TOTAL:`, totalColPos, doc.y, { continued: true, width: 100, align: "right" })
			.text(`₹${order.totalAmount.toFixed(2)}`, endX - 50, doc.y, {
				align: "right",
				underline: true,
			});

		doc.end();
	} catch (error) {
		console.error("PDF generation failed:", error);
		throw new Error("PDF generation failed");
	}
}

export { orderDetails, getAdminSingleOrderDetails, updateOrderStatus, generateInvoicePdf };
