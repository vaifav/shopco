import { getCategories, createProduct, getProducts, getProductEditDetails } from "../../services/admin/productService.js";
import { productJoiSchema } from "../../validation/addProductJoiValidation.js";
import { uploadMultipleImages } from "../../services/cloudinaryService.js";

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

const getProductEdit = async (req,res) => {
	try {
		const categories = await getCategories();
		const product = await getProductEditDetails(req.params.id);
		
		return res.render("admin/adminProductsEdit", {
			categories,product
		});
	} catch (error) {
		console.error("Error loading product Edit page:", error);
	}
}

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
	const variantsToProcess = validatedProductData.variants;
	const allVariantUploadPromises = [];
	const productBaseName = validatedProductData.productName.toLowerCase();

	try {
		const MAX_VARIANTS = 10;
		for (let i = 0; i < MAX_VARIANTS; i++) {
			const fieldName = `variants[${i}][image]`;
			const fileArray = files[fieldName];

			if (fileArray && fileArray.length > 0 && variantsToProcess[i]) {
				const buffers = fileArray.map((file) => file.buffer);
				const baseId = `${productBaseName}-v${i}`;

				allVariantUploadPromises.push(uploadMultipleImages(buffers, baseId, "productVariants"));
			} else {
				allVariantUploadPromises.push(Promise.resolve([]));
			}
		}

		const allVariantUploadResults = await Promise.all(allVariantUploadPromises);

		variantsToProcess.forEach((variant, index) => {
			const uploadResults = allVariantUploadResults[index];
			const secureUrls = uploadResults.map((result) => result.secure_url);
			variant.images = secureUrls || [];
		});

		const newProduct = await createProduct(validatedProductData);

		console.log(req.body);
		console.log(validatedProductData);
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
export { productListPage, getProductAdd,getProductEdit, addProduct };
