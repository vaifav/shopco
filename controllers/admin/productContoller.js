import crypto from "crypto";
import {
	getCategories,
	createProduct,
	getProducts,
	getProductEditDetails,
} from "../../services/admin/productService.js";
import { productJoiSchema } from "../../validation/addProductJoiValidation.js";
import { uploadSingleImage } from "../../services/cloudinaryService.js";

const productListPage = async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const createdAt = parseInt(req.query.createdAt) || -1;
	const search = req.query.search;
	const isBlocked = req.query.isBlocked === "true" ? true : false;

	try {
		const data = await getProducts(page, limit, createdAt, search);
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
	console.log(validatedProductData);

	const files = req.files;
	console.log(files);

	const variantImageUploadPromises = [];
	const variants = validatedProductData.variants;
	const productBaseName = validatedProductData.productName.toLowerCase();

	try {
		const MAX_VARIANTS = 10;
		for (let i = 0; i < MAX_VARIANTS; i++) {
			const fileArray = files[`variants[${i}][image]`];

			if (fileArray && fileArray.length > 0 && variants[i]) {
				variants[i].images = [];
				const variantUploads = fileArray.map((file, index) => {
					const public_id = `${productBaseName}-${crypto.randomUUID()}-v${index}`;
					const promise = uploadSingleImage(file.buffer, public_id, "productVariants").then((result) =>
						variants[i].images.push(result.secure_url)
					);
					return promise;
				});
				variantImageUploadPromises.push(...variantUploads);
			}
		}
		if (variantImageUploadPromises.length !== 0) {
			await Promise.all(variantImageUploadPromises);
		}
		const newProduct = await createProduct(validatedProductData);

		return res.status(201).json({
			success: true,
			message: "Product and variants added successfully.",
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({
			success: false,
			message: "Server error during file upload or database save.",
		});
	}
};

const editProduct = async (req, res) => {
	console.log(req.body);
	return res.redirect("/products");
};
export { productListPage, getProductAdd, getProductEdit, addProduct, editProduct };
