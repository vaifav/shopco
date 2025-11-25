import OrderModel from "../../models/orderModel.js";

async function generateSalesReport(startDate, endDate) {
	const start = startDate ? new Date(startDate) : new Date(0);
	let end;

	if (endDate) {
		end = new Date(endDate);
		end.setDate(end.getDate() + 1);
		end.setMilliseconds(end.getMilliseconds() - 1);
	} else {
		end = new Date();
	}
	console.log(start);
	console.log(end);

	const overallMetrics = await OrderModel.aggregate([
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
				"items.itemStatus": "Delivered",
			},
		},
		{ $unwind: "$items" },
		{
			$match: {
				"items.itemStatus": "Delivered",
			},
		},
		{
			$lookup: {
				from: "variants",
				localField: "items.variantId",
				foreignField: "_id",
				as: "variantData",
			},
		},
		{ $unwind: { path: "$variantData", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: null,
				totalRevenue: { $sum: { $multiply: ["$variantData.price", "$items.quantity"] } },
				totalOrders: { $addToSet: "$_id" },
				totalOverallDiscount: {
					$sum: {
						$multiply: ["$items.quantity", "$variantData.discountedPrice"],
					},
				},
				totalCouponDeduction: { $sum: "$items.couponDiscountAmount" },
			},
		},
		{
			$project: {
				_id: 0,
				totalRevenue: { $round: ["$totalRevenue", 2] },
				totalOrders: { $size: "$totalOrders" },
				totalOverallDiscount: { $round: ["$totalOverallDiscount", 2] },
				totalCouponDeduction: { $round: ["$totalCouponDeduction", 2] },
			},
		},
	]);

	const metrics = overallMetrics[0] || {
		totalRevenue: 0,
		totalOrders: 0,
		totalOverallDiscount: 0,
		totalCouponDeduction: 0,
	};

	const netRevenue =
		metrics.totalRevenue - metrics.totalOverallDiscount - metrics.totalCouponDeduction;

	const topProducts = await OrderModel.aggregate([
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
				"items.itemStatus": "Delivered",
			},
		},
		{ $unwind: "$items" },
		{
			$match: {
				"items.itemStatus": "Delivered",
			},
		},
		{
			$lookup: {
				from: "products",
				localField: "items.productId",
				foreignField: "_id",
				as: "productData",
			},
		},
		{ $unwind: "$productData" },
		{
			$lookup: {
				from: "categories",
				localField: "productData.category",
				foreignField: "_id",
				as: "categoryData",
			},
		},
		{ $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: "$items.productId",
				name: { $first: "$items.name" },
				category: { $first: "$categoryData.categoryName" },
				unitsSold: { $sum: "$items.quantity" },
				grossRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
				totalCouponDiscount: { $sum: "$items.couponDiscountAmount" },
			},
		},
		{
			$sort: { unitsSold: -1, grossRevenue: -1 },
		},
		{ $limit: 5 },
		{
			$project: {
				_id: 0,
				name: 1,
				unitsSold: 1,
				grossRevenue: { $round: ["$grossRevenue", 2] },
				discount: { $round: ["$totalCouponDiscount", 2] },
				category: { $ifNull: ["$category", "N/A"] },
			},
		},
	]);

	const salesByCategoryRaw = await OrderModel.aggregate([
		{
			$match: {
				createdAt: { $gte: start, $lte: end },
				"items.itemStatus": "Delivered",
			},
		},
		{ $unwind: "$items" },
		{
			$match: {
				"items.itemStatus": "Delivered",
			},
		},
		{
			$lookup: {
				from: "products",
				localField: "items.productId",
				foreignField: "_id",
				as: "productData",
			},
		},
		{ $unwind: "$productData" },
		{
			$lookup: {
				from: "categories",
				localField: "productData.category",
				foreignField: "_id",
				as: "categoryData",
			},
		},
		{ $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: false } },
		{
			$group: {
				_id: "$productData.category",
				name: { $first: "$categoryData.categoryName" },
				totalSales: {
					$sum: {
						$subtract: [
							{ $multiply: ["$items.price", "$items.quantity"] },
							"$items.couponDiscountAmount",
						],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				name: 1,
				sales: { $round: ["$totalSales", 2] },
			},
		},
	]);

	const totalNetSales = salesByCategoryRaw.reduce((sum, category) => sum + category.sales, 0);

	const salesByCategory = salesByCategoryRaw.map((category) => ({
		...category,
		percentage: totalNetSales > 0 ? (category.sales / totalNetSales) * 100 : 0,
	}));

	return {
		totalRevenue: metrics.totalRevenue,
		totalOrders: metrics.totalOrders,
		overallDiscount: metrics.totalOverallDiscount,
		couponDeduction: metrics.totalCouponDeduction,
		netRevenue: netRevenue,
		topProducts: topProducts,
		salesByCategory: salesByCategory,
	};
}

export { generateSalesReport };
