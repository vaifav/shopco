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

const getProducts = async (
	page = 1,
	limit = 5,
	createdAt,
	productName,
	rating,
	stock,
	price,
	variants,
	search = "",
	isBlocked = false
) => {
	let data = {};
	const query = {};
	const sortCriteria = {};

	const sortOption = { createdAt, productName, rating, stock, price };
	const activeSortEntry = Object.entries(sortOption).find(([field, order]) => order !== null);

	if (activeSortEntry) {
		const [field, order] = activeSortEntry;
		if (field === "stock" || field === "price") {
			sortCriteria[`${field}Variant`] = order;
			console.log(`${field}Variant`);
		} else {
			sortCriteria[field] = order;
		}
	} else {
		sortCriteria["createdAt"] = -1;
	}

	if (search && search.trim() !== "") {
		const regex = new RegExp("^" + search, "i");
		query.$or = [{ productName: { $regex: regex } }];
	}

	if (isBlocked === true || isBlocked === false) {
		query.isBlocked = isBlocked;
	}

	try {
		if (limit > 5) limit = 5;

		if (variants === 1) {
			const totalVariants = await productModel.aggregate([
				{ $match: query },
				{ $group: { _id: null, variantSize: { $sum: { $size: "$variants" } } } },
				{ $project: { _id: 0, variantSize: 1 } },
			]);
			const total = totalVariants[0].variantSize;

			let totalPages = Math.ceil(total / limit);
			if (page < 1) page = 1;
			if (page > totalPages) page = totalPages || 1;
			let skip = (page - 1) * limit;

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
					$addFields: {
						stockVariant: "$allVariants.stock",
						priceVariant: "$allVariants.price",
					},
				},
				{
					$sort: sortCriteria,
				},
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},
				{
					$unset: ["stockVariant", "priceVariant"],
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
						isBlocked: "$isBlocked",
					},
				},
			]);

			return data;
		}

		data = {};
		const totalProducts = await productModel.countDocuments(query);
		let total = totalProducts;
		let totalPages = Math.ceil(total / limit);
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages || 1;
		let skip = (page - 1) * limit;

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
				$addFields: {
					stockVariant: "$allVariants[0].stock",
					priceVariant: "$allVariants[0].price",
				},
			},
			{
				$sort: sortCriteria,
			},
			{
				$skip: skip,
			},
			{
				$limit: limit,
			},
			{
				$unset: ["stockVariant", "priceVariant"],
			},
			{
				$project: {
					_id: 0,
					vrId: { $arrayElemAt: ["$allVariants._id", 0] },
					image: { $arrayElemAt: [{ $arrayElemAt: ["$allVariants.images", 0] }, 0] },
					price: { $arrayElemAt: ["$allVariants.price", 0] },
					color: { $arrayElemAt: ["$allVariants.color", 0] },
					stock: { $arrayElemAt: ["$allVariants.stock", 0] },
					prId: "$_id",
					productName: "$productName",
					rating: "$rating",
					isBlocked: "$isBlocked",
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

const updateProduct = async (_id, data) => {
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

		const updateProductFields = {
			productName: data.productName,
			category: data.category,
			description: data.description,
			targetedAudience: processedTargetedAudience,
			tags: processedTags,
			rating: data.rating,
		};

		const product = await productModel.findOne({ _id });
		if (!product) throw new Error("Product not found..");

		if (Object.hasOwn(data, "isBlocked")) {
			await productModel.findOneAndUpdate(
				{ _id },
				{ $set: { isBlocked: data.isBlocked } },
				{ new: true }
			);
		} else {
			await productModel.findOneAndUpdate({ _id }, { $set: updateProductFields }, { new: true });
		}

		for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
			const variantId = product.variants[variantIndex];
			if (!variantId) {
				const newVariant = await variantModel.create({
					...variants[variantIndex],
					product: product._id,
				});
				await productModel.findOneAndUpdate(
					{ _id },
					{ $push: { variants: newVariant._id } },
					{ new: true }
				);
			}

			const newImages = variants[variantIndex].images;
			const hasNewImages = Array.isArray(newImages) && newImages.length > 0;

			const updateOperation = {
				$set: {
					price: variants[variantIndex].price,
					color: variants[variantIndex].color,
					sizes: variants[variantIndex].sizes,
					stock: variants[variantIndex].stock,
					discountedPrice: variants[variantIndex].discountedPrice,
				},
			};

			if (hasNewImages) {
				updateOperation.$push = {
					images: { $each: newImages },
				};
			} else {
				updateOperation.$set.images = variants[variantIndex].existingImages || [];
			}
			const updateVariant = await variantModel.findOneAndUpdate({ _id: variantId }, updateOperation, {
				new: true,
			});
		}
		return product;
	} catch (error) {
		console.log(error);
		throw new Error(error.message);
	}
};

const deleteProduct = async (_id) => {
	try {
		const product = await productModel.findOne({ _id });
		if (!product) throw new Error("Product not found..");

		const deletedProduct = await productModel.findOneAndUpdate(
			{ _id },
			{ $set: { isBlocked: true } },
			{ new: true }
		);
		return deletedProduct;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

const restoreProduct = async (_id) => {
	try {
		const product = await productModel.findOne({ _id });
		if (!product) throw new Error("Product not found..");

		const category = await categoryModel.findOne({ _id: product.category });
		if (category.isBlocked) {
			throw new Error(`This product belongs to a blocked category - ${category.categoryName}`);
		}

		const deletedProduct = await productModel.findOneAndUpdate(
			{ _id },
			{ $set: { isBlocked: false } },
			{ new: true }
		);
		return deletedProduct;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};

export {
	getProducts,
	getCategories,
	getProductEditDetails,
	createProduct,
	updateProduct,
	deleteProduct,
	restoreProduct,
};
