import Joi from "joi";
import {
	createCategory,
	deleteCategory,
	getAllCategoryDetails,
	getCategoryInfo,
	getParentCategories,
	updateCategory,
} from "../../services/admin/categoryService.js";
import { uploadSingleImage } from "../../services/cloudinaryService.js";

const addCategorySchema = Joi.object({
	categoryName: Joi.string().trim().min(2).max(100).required().messages({
		"string.min": "Category name must be at least 2 characters",
		"string.max": "Category name cannot exceed 100 characters",
		"any.required": "Category name is required",
		"string.empty": "Category name cannot be empty",
	}),
	parentCategory: Joi.string().hex().length(24).allow(null, ""),
	description: Joi.string().trim().max(500).allow(null, ""),
	categoryImage: Joi.string().trim().default("").allow(null, ""),
	metaTitle: Joi.string().trim().max(60).allow(null, ""),
	metaDescription: Joi.string().trim().max(160).allow(null, ""),
	sortOrder: Joi.number().integer().min(0).default(0),
});

const category = async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const createdAt = parseInt(req.query.createdAt) || -1;
	const search = req.query.search;
	const isBlocked = req.query.isBlocked === "true" ? true : false;

	const data = await getAllCategoryDetails(page, limit, createdAt, search, isBlocked);
	return res.render("admin/adminCategory", data);
};

const getCategoryAddPage = async (req, res) => {
	try {
		const parentCategories = await getParentCategories();
		return res.render("admin/adminCategoryAdd", { parentCategories });
	} catch (error) {
		console.log(error.message);
	}
};

const getCategoryEditPage = async (req, res) => {
	try {
		const category = await getCategoryInfo(req.params.id);

		if (!category) {
			return res
				.status(404)
				.render("error", { message: `Category with ID ${req.params.id} not found.` });
		}

		const parentCategories = await getParentCategories();
		return res.render("admin/adminCategoryEdit", { category, parentCategories });
	} catch (error) {
		console.log(error.message);
	}
};

const addCategory = async (req, res) => {
	const userId = req.session.user.userId;
	const file = req.file;
	const { error, value } = addCategorySchema.validate(req.body, {
		allowUnknown: true,
		abortEarly: true,
	});

	if (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}

	const data = value;
	try {
		const category = await createCategory(data, userId);
		res.status(201).json({
			success: true,
			message: "Category Added SucccessFully",
		});

		if (file) {
			try {
				const result = await uploadSingleImage(file.buffer, category._id, "categoryImage");
				const update = await updateCategory({ categoryImage: result.secure_url }, category._id, userId);
			} catch (error) {
				console.log("Couldn't upload category: " + error.message);
			}
		}
	} catch (error) {
		console.error("Error adding category:", error.message);
		return res.status(500).json({
			success: false,
			message: `A server error occurred while processing the request.`,
		});
	}
};

const editCategory = async (req, res) => {
	const userId = req.session.user.userId;
	const file = req.file;

	const data = req.body;
	try {
		if (file) {
			try {
				const result = await uploadSingleImage(file.buffer, req.params.id, "categoryImage");
				data.categoryImage = result.secure_url;
			} catch (error) {
				console.log("Couldn't upload category: " + error.message);
			}
		}

		const category = await updateCategory(data, req.params.id, userId);
		return res.status(201).json({
			success: true,
			message: "Category Updated SucccessFully",
		});
	} catch (error) {
		console.error("Error updating category:", error.message);
		return res.status(500).json({
			success: false,
			message: `A server error occurred while processing the request.`,
		});
	}
};

const removeCategory = async (req, res) => {
	const id = req.params.id;
	try {
		const remove = await deleteCategory(id);
		return res.status(200).json({
			success: true,
			message: "Category Removed SucccessFully",
		});
	} catch (error) {
		console.error("Error updating category:", error.message);
		return res.status(500).json({
			success: false,
			message: `A server error occurred while processing the request.`,
		});
	}
};

export {
	category,
	getCategoryAddPage,
	getCategoryEditPage,
	addCategory,
	editCategory,
	removeCategory,
};
