import Joi from "joi";

const variantJoiSchema = Joi.object({
	image: Joi.any().optional(),

	price: Joi.number().min(0).required().messages({
		"number.base": "Price must be a number.",
		"number.min": "Price cannot be negative.",
		"any.required": "Price is required.",
	}),

	discountedPrice: Joi.number().min(0).less(Joi.ref("price")).allow(null, "").optional().messages({
		"number.base": "Discounted price must be a number.",
		"number.min": "Discounted price cannot be negative.",
		"number.less": "Discounted price must be less than the base price.",
	}),

	color: Joi.string().trim().required().messages({
		"string.empty": "Color is required.",
		"any.required": "Color is required.",
	}),

	sizes: Joi.string().trim().required().messages({
		"string.empty": "Sizes are required (e.g., S, M, L).",
		"any.required": "Sizes are required.",
	}),

	stock: Joi.number().min(0).required().messages({
		"number.base": "Stock quantity must be a number.",
		"number.min": "Stock quantity cannot be negative.",
		"any.required": "Stock quantity is required.",
	}),
});

const productJoiSchema = Joi.object({
	productName: Joi.string().trim().min(3).required().messages({
		"string.empty": "Product Name is required.",
		"any.required": "Product Name is required.",
		"string.min": "Product Name must be at least 3 characters long.",
	}),

	description: Joi.string().required().min(10).messages({
		"string.empty": "Description is required.",
		"any.required": "Description is required.",
		"string.min": "Description must be at least 10 characters long.",
	}),

	brand: Joi.string().allow('').optional().messages({
		"string.empty": "Brand selection is required.",
		"any.required": "Brand selection is required.",
		"string.hex": "Invalid Brand ID format.",
	}),

	category: Joi.string().allow('').optional().messages({
		"string.empty": "Category selection is required.",
		"any.required": "Category selection is required.",
		"string.hex": "Invalid Category ID format.",
	}),

	targetedAudience: Joi.string().trim().allow(null, "").optional(),

	tags: Joi.string().trim().allow(null, "").optional(),

	rating: Joi.number().min(1).max(5).allow(null, "").optional(),

	variants: Joi.array().min(1).items(variantJoiSchema).required().messages({
		"array.min": "At least one variant is required.",
		"any.required": "Variant details are required.",
	}),
});

export { productJoiSchema, variantJoiSchema };
