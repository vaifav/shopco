import Joi from "joi";

const categoryJoiSchema = Joi.object({
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

export { categoryJoiSchema };
