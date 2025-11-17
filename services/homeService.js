import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

const getAllData = async () => {
	const data = {};
	try {
		const products = await productModel.aggregate([
			{ $match: { isBlocked: false } },
			{
				$lookup: {
					from: "variants",
					localField: "variants",
					foreignField: "_id",
					as: "allVariants",
				},
			},
			{
				$unwind: "$allVariants",
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					image: { $arrayElemAt: ["$allVariants.images", 0] },
					price: "$allVariants.price",
					discountedPrice: "$allVariants.discountedPrice",
					color: "$allVariants.color",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
				},
			},
		]);
		const category = await categoryModel
			.find({ isBlocked: false })
			.sort({ createdAt: -1, _id: -1 })
			.limit(4);

		data.products = products;
		data.category = category;

		return data;
	} catch (err) {
		console.log(err);
	}
};

export { getAllData };
