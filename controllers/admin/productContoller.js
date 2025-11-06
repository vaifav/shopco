import {
	getCategories,
	createProduct,
	getProducts,
	getProductEditDetails,
	updateProduct,
	deleteProduct,
} from "../../services/admin/productService.js";
import { productJoiSchema } from "../../validation/addProductJoiValidation.js";
import { processVariantImages } from "../../services/admin/varinatImageUploadService.js";

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
			message: "Product data validation failed.",
		});
	}

	validatedProductData = {
		...validatedProductData,
		variants: Array.isArray(validatedProductData.variants)
			? req.body.variants.map((variant) => ({ ...variant }))
			: [],
	};

	const files = req.files;
	console.log(files);

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
export {
	productListPage,
	getProductAdd,
	getProductEdit,
	addProduct,
	editProduct,
	softDeleteProduct,
};
