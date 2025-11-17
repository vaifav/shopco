import {
	getCategories,
	createProduct,
	getProducts,
	getProductEditDetails,
	updateProduct,
	deleteProduct,
	restoreProduct,
} from "../../services/admin/productService.js";
import { productJoiSchema } from "../../validation/addProductJoiValidation.js";
import { processVariantImages } from "../../services/admin/varinatImageUploadService.js";

const validateEditProductData = (data) => {
	const validatedData = { ...data };

	if (typeof validatedData.targetedAudience === "string") {
		validatedData.targetedAudience = validatedData.targetedAudience
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}
	if (typeof validatedData.tags === "string") {
		validatedData.tags = validatedData.tags
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}

	const { productName, category, description, rating, variants } = validatedData;

	if (!productName || !category || !description) {
		return {
			status: 400,
			message: "Product Name, Category, and Description are required fields.",
		};
	}

	const validatedRating = rating !== undefined ? Number(rating) : undefined;
	if (validatedRating !== undefined) {
		if (isNaN(validatedRating) || validatedRating < 0 || validatedRating > 5) {
			return {
				status: 400,
				message: "Rating must be a number between 0 and 5.",
			};
		}
		validatedData.rating = validatedRating;
	}

	if (variants && variants.length > 0) {
		for (let i = 0; i < variants.length; i++) {
			const variant = variants[i];
			const variantColor = variant.color || `Variant ${i + 1}`;

			if (typeof variant.existingImages === "string") {
				variant.existingImages = variant.existingImages
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}

			const allImages = (variant.existingImages || []).concat(variant.images || []);

			if (
				!variant.price ||
				!variant.color ||
				!variant.sizes ||
				!variant.stock ||
				allImages.length === 0
			) {
				return {
					status: 400,
					message: `Variant '${variantColor}' is missing required fields: price, color, sizes, stock, or images.`,
				};
			}

			const validatedPrice = Number(variant.price);
			const validatedStock = Number(variant.stock);
			const validatedDiscountedPrice =
				variant.discountedPrice !== undefined ? Number(variant.discountedPrice) : undefined;

			if (isNaN(validatedPrice) || validatedPrice <= 100) {
				return {
					status: 400,
					message: `Price for variant '${variantColor}' must be a number greater than 100.`,
				};
			}
			if (isNaN(validatedStock) || validatedStock < 0) {
				return {
					status: 400,
					message: `Stock for variant '${variantColor}' must be a non-negative number.`,
				};
			}

			if (validatedDiscountedPrice !== undefined) {
				if (isNaN(validatedDiscountedPrice) || validatedDiscountedPrice < 0) {
					return {
						status: 400,
						message: `Discounted price for variant '${variantColor}' must be a non-negative number.`,
					};
				}
				if (validatedDiscountedPrice > validatedPrice) {
					return {
						status: 400,
						message: `Discounted price for variant '${variantColor}' (${validatedDiscountedPrice}) cannot be greater than the base price (${validatedPrice}).`,
					};
				}
			}

			variant.price = validatedPrice;
			variant.stock = validatedStock;
			if (validatedDiscountedPrice !== undefined) {
				variant.discountedPrice = validatedDiscountedPrice;
			}
		}
		validatedData.variants = variants;
	}

	return null;
};

const productListPage = async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const createdAt = parseInt(req.query.createdAt) || null;
	const productName = parseInt(req.query.productName) || null;
	const rating = parseInt(req.query.rating) || null;
	const stock = parseInt(req.query.stock) || null;
	const price = parseInt(req.query.price) || null;
	const variants = parseInt(req.query.variants) || null;
	const search = req.query.search;
	const isBlocked = req.query.isBlocked === "true" ? true : false;

	try {
		const data = await getProducts(
			page,
			limit,
			createdAt,
			productName,
			rating,
			stock,
			price,
			variants,
			search,
			isBlocked
		);
		return res.render("admin/adminProducts", data);
	} catch (error) {
		console.error("Error loading product addition page:", error);
	}
};

const getProductAdd = async (req, res) => {
	try {
		const categories = await getCategories();
		return res.render("admin/adminProductsAdd", {
			categories,
		});
	} catch (error) {
		console.error("Error loading product addition page:", error);
	}
};

const getProductEdit = async (req, res) => {
	console.log(req.params.id);

	try {
		const categories = await getCategories();
		const product = await getProductEditDetails(req.params.id);

		return res.render("admin/adminProductsEdit", {
			categories,
			product,
		});
	} catch (error) {
		console.error("Error loading product Edit page:", error);
	}
};

const addProduct = async (req, res) => {
	let { error, value: validatedProductData } = productJoiSchema.validate(req.body, {
		abortEarly: true,
		stripUnknown: true,
		convert: true,
	});

	if (error) {
		return res.status(400).json({
			success: false,
			message: error.details.message,
		});
	}

	validatedProductData = {
		...req.body,
		variants: Array.isArray(validatedProductData.variants)
			? req.body.variants.map((variant) => ({ ...variant }))
			: [],
	};

	const files = req.files;
	const variants = validatedProductData.variants;

	try {
		await processVariantImages(variants, files);
		const newProduct = await createProduct(validatedProductData);

		return res.status(201).json({
			success: true,
			message: "Product and variants added successfully.",
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const editProduct = async (req, res) => {
	const variants = req.body.variants;
	const files = req.files;

	const validatedProductData = {
		...req.body,
		variants: Array.isArray(variants) ? req.body.variants.map((variant) => ({ ...variant })) : [],
	};

	const validationError = validateEditProductData(validatedProductData);

	if (validationError) {
		return res.status(validationError.status).json({
			success: false,
			message: validationError.message,
		});
	}

	try {
		if (validatedProductData.variants.length !== 0) {
			await processVariantImages(validatedProductData.variants, files);
		}
		const newProduct = await updateProduct(req.params.id, validatedProductData);

		return res.status(200).json({
			success: true,
			message: "Product and variants edited successfully.",
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const softDeleteProduct = async (req, res) => {
	try {
		await deleteProduct(req.params.id);
		return res.status(200).json({
			success: true,
			message: "Product blocked successfully.",
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
const unblockProduct = async (req, res) => {
	try {
		await restoreProduct(req.params.id);
		return res.status(200).json({
			success: true,
			message: "Product Unblocked successfully.",
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
export {
	productListPage,
	getProductAdd,
	getProductEdit,
	addProduct,
	editProduct,
	softDeleteProduct,
	unblockProduct,
};
