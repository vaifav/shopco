import mongoose from "mongoose";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import variantModel from "../../models/variantModel.js";

const getCategories = async () => {
	try {
		const category = await categoryModel.find({ isBlocked: false }, { _id: 1, categoryName: 1 });
		return category;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const getProducts = async (page = 1, limit = 5, createdAt = -1, search = "", isBlocked = "") => {
	const data = {};
	const query = {};

	if (search && search.trim() !== "") {
		const regex = new RegExp("^" + search, "i");
		query.$or = [{ productName: { $regex: regex } }];
	}

	if (isBlocked === true || isBlocked === false) {
		query.isBlocked = isBlocked;
	}

	try {
		if (limit > 5) limit = 5;
		let total = await variantModel.countDocuments();
		let totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		const totalProducts = await productModel.countDocuments(query);
		total = totalProducts;
		totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		skip = (page - 1) * limit;

		data.total = total;
		data.page = page;
		data.limit = limit;
		data.totalPages = totalPages;
		data.data = await productModel.aggregate([
			{ $match: query },
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
				$sort: { createdAt },
			},
			{
				$skip: skip,
			},
			{
				$limit: limit,
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					image: { $arrayElemAt: ["$allVariants.images", 0] },
					price: "$allVariants.price",
					color: "$allVariants.color",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
				},
			},
		]);
		return data;
	} catch (error) {
		console.log(error.message);
	}
};

const getProductEditDetails = async (_id) => {
	try {
		const products = await productModel.aggregate([
			{ $match: { _id: new mongoose.Types.ObjectId(_id) } },
			{
				$lookup: {
					from: "variants",
					localField: "variants",
					foreignField: "_id",
					as: "variants",
				},
			},
		]);

		return products[0];
	} catch (error) {
		console.log(error.message);
	}
};

const createProduct = async (data) => {
	try {
		let { variants, tags, targetedAudience } = data;

		variants.forEach((v) => {
			v.sizes = v.sizes
				.split(",")
				.map((size) => size.trim())
				.filter((size) => size);
		});

		const processedTags = tags
			? tags
					.split(",")
					.map((t) => t.trim())
					.filter((t) => t)
			: [];

		const processedTargetedAudience = targetedAudience
			? targetedAudience
					.split(",")
					.map((a) => a.trim())
					.filter((a) => a)
			: [];

		const variant = await variantModel.create(variants);
		const variantIds = variant.map((doc) => doc._id);

		const product = await productModel.create({
			productName: data.productName,
			category: data.category,
			description: data.description,
			targetedAudience: processedTargetedAudience,
			tags: processedTags,
			rating: data.rating,
			variants: variantIds,
		});
		await variantModel.updateMany({ _id: { $in: variantIds } }, { $set: { product: product._id } });
		return product;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const updateProduct = async (_id, data) => {};

export { getProducts, getCategories, getProductEditDetails, createProduct };
