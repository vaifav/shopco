import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import variantModel from "../models/variantModel.js";

const getProductData = async (
	page = 1,
	limit = 5,
	search = "",
	category,
	size,
	price = -1,
	minprice,
	maxprice
) => {
	const data = {};
	const query = {};
	const range = {};
	const pipeline = [];
	const sizeFilter = [];

	const selectedSizes =
		size && size.trim() !== ""
			? size
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s !== "")
			: [];

	const selectedCategories =
		category && category.trim() !== ""
			? category
					.split(",")
					.map((id) => {
						try {
							return new mongoose.Types.ObjectId(id.trim());
						} catch (error) {
							return null;
						}
					})
					.filter((id) => id !== null)
			: [];

	if (search && search.trim() !== "") {
		pipeline.push({ $match: { $text: { $search: search } } });
	}

	if (selectedCategories.length > 0) {
		query.category = { $in: selectedCategories };
	}

	if (selectedSizes.length > 0) {
		sizeFilter.push({
			$match: {
				"allVariants.sizes": { $in: selectedSizes },
			},
		});
	}

	if (minprice && maxprice) {
		range.$match = {
			$and: [{ priceVariant: { $gte: minprice } }, { priceVariant: { $lte: maxprice } }],
		};
	} else {
		range.$match = {
			priceVariant: { $gte: 0 },
		};
	}

	query.isBlocked = false;
	pipeline.push({ $match: query });

	try {
		const totalVariants = await productModel.aggregate([
			...pipeline,
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
				$addFields: {
					priceVariant: "$allVariants.price",
				},
			},
			...sizeFilter,
			{ ...range },
			{ $group: { _id: null, variantSize: { $sum: 1 } } },
			{ $project: { _id: 0, variantSize: 1 } },
		]);

		const minMaxPrice = await productModel.aggregate([
			{
				$lookup: {
					from: "variants",
					localField: "variants",
					foreignField: "_id",
					as: "allVariants",
				},
			},
			{
				$facet: {
					minPrice: [
						{ $unwind: "$allVariants" },
						{ $group: { _id: null, value: { $min: "$allVariants.price" } } },
						{ $project: { _id: 0, min: "$value" } },
					],
					maxPrice: [
						{ $unwind: "$allVariants" },
						{ $group: { _id: null, value: { $max: "$allVariants.price" } } },
						{ $project: { _id: 0, max: "$value" } },
					],
				},
			},
		]);

		const minPriceValue = minMaxPrice[0]?.minPrice[0]?.min || 0;
		const maxPriceValue = minMaxPrice[0]?.maxPrice[0]?.max || 0;

		const total = totalVariants[0]?.variantSize || 0;
		let totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

		data.total = total;
		data.page = page;
		data.limit = limit;
		data.totalPages = totalPages;
		data.maxPrice = maxPriceValue;
		data.minPrice = minPriceValue;
		data.categories = await categoryModel.find({ isBlocked: false });
		data.products = await productModel.aggregate([
			...pipeline,
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
			...sizeFilter,
			{
				$addFields: {
					priceVariant: "$allVariants.price",
				},
			},
			{ ...range },
			{
				$sort: { priceVariant: price },
			},
			{
				$skip: skip,
			},
			{
				$limit: limit,
			},
			{
				$unset: "priceVariant",
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
					sizes: "$allVariants.sizes",
				},
			},
		]);
		console.log(data);
		
		return data;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const getSingleProduct = async (_id, varId) => {
	const data = {};
	try {
		const findProduct = await productModel.findOne({ _id: new mongoose.Types.ObjectId(_id) });
		if (!findProduct) throw new Error("Product not found");

		const product = await productModel.aggregate([
			{
				$match: {
					isBlocked: false,
					_id: new mongoose.Types.ObjectId(_id),
				},
			},
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
				$match: {
					"allVariants._id": new mongoose.Types.ObjectId(varId),
				},
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					price: "$allVariants.price",
					images: "$allVariants.images",
					discountedPrice: "$allVariants.discountedPrice",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
					description: "$description",
					sizes: "$allVariants.sizes",
					variantColor: "$allVariants.color",
				},
			},
		]);

		if (product.length === 0) {
			throw new Error("Variant not found for this product.");
		}

		const colors = await variantModel.aggregate([
			{ $match: { product: new mongoose.Types.ObjectId(_id) } },
			{ $group: { _id: null, colors: { $addToSet: "$color" } } },
			{ $project: { _id: 0, colors: "$colors" } },
		]);

		const categoryId = findProduct.category;
		const productBasedOnCategory = await productModel.aggregate([
			{
				$match: {
					isBlocked: false,
					category: new mongoose.Types.ObjectId(categoryId),
				},
			},
			{
				$limit: 4,
			},
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
				$match: {
					"allVariants._id": { $ne: new mongoose.Types.ObjectId(varId) },
				},
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					price: "$allVariants.price",
					images: "$allVariants.images",
					discountedPrice: "$allVariants.discountedPrice",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
					description: "$description",
					sizes: "$allVariants.sizes",
					variantColor: "$allVariants.color",
				},
			},
		]);

		data.product = product[0];
		data.product.colors = colors.length > 0 ? colors[0]["colors"] : [];
		data.relatedProducts = productBasedOnCategory;

		return data;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const getSingleProductByColor = async (_id, varId, color) => {
	const data = {};
	const colorRegex = new RegExp(`^${color}$`, "i");
	try {
		const findProduct = await productModel.findOne({ _id: new mongoose.Types.ObjectId(_id) });
		if (!findProduct) throw new Error("Product not found");

		const product = await productModel.aggregate([
			{
				$match: {
					isBlocked: false,
					_id: new mongoose.Types.ObjectId(_id),
				},
			},
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
				$match: {
					"allVariants.color": colorRegex,
				},
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					price: "$allVariants.price",
					images: "$allVariants.images",
					discountedPrice: "$allVariants.discountedPrice",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
					description: "$description",
					sizes: "$allVariants.sizes",
					variantColor: "$allVariants.color",
				},
			},
		]);

		if (product.length === 0) {
			throw new Error("Variant not found for this product.");
		}

		const colors = await variantModel.aggregate([
			{ $match: { product: new mongoose.Types.ObjectId(_id) } },
			{ $group: { _id: null, colors: { $addToSet: "$color" } } },
			{ $project: { _id: 0, colors: "$colors" } },
		]);

		const categoryId = findProduct.category;
		const productBasedOnCategory = await productModel.aggregate([
			{
				$match: {
					isBlocked: false,
					category: new mongoose.Types.ObjectId(categoryId),
				},
			},
			{
				$limit: 4,
			},
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
				$match: {
					"allVariants._id": new mongoose.Types.ObjectId(varId),
				},
			},
			{
				$project: {
					_id: 0,
					vrId: "$allVariants._id",
					price: "$allVariants.price",
					images: "$allVariants.images",
					discountedPrice: "$allVariants.discountedPrice",
					stock: "$allVariants.stock",
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
					description: "$description",
					sizes: "$allVariants.sizes",
					variantColor: "$allVariants.color",
				},
			},
		]);

		data.product = product[0];
		data.product.colors = colors.length > 0 ? colors[0]["colors"] : [];
		data.relatedProducts = productBasedOnCategory;

		return data;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

export { getProductData, getSingleProduct, getSingleProductByColor };
