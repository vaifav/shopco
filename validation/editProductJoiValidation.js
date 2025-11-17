import Joi from "joi";

const variantJoiSchema = Joi.object({
    // Added an optional _id for identifying the variant being updated
    _id: Joi.string().hex().length(24).optional().messages({
        "string.hex": "Invalid Variant ID format.",
        "string.length": "Invalid Variant ID format.",
    }),
    image: Joi.any().optional(),

    price: Joi.number().min(100).optional().messages({ // Made optional
        "number.base": "Price must be a number.",
        "number.min": "Price should be greater than or equal to 100.",
    }),

    discountedPrice: Joi.number().min(0).less(Joi.ref("price")).allow(null, "").optional().messages({
        "number.base": "Discounted price must be a number.",
        "number.min": "Discounted price cannot be negative.",
        "number.less": "Discounted price must be less than the base price.",
    }),

    color: Joi.string().trim().optional().messages({ // Made optional
        "string.empty": "Color cannot be empty.",
    }),

    sizes: Joi.string().trim().optional().messages({ // Made optional
        "string.empty": "Sizes cannot be empty (e.g., S, M, L).",
    }),

    stock: Joi.number().min(0).optional().messages({ // Made optional
        "number.base": "Stock quantity must be a number.",
        "number.min": "Stock quantity cannot be negative.",
    }),
});


const editProductJoiSchema = Joi.object({
    productName: Joi.string().trim().min(3).optional().messages({ // Changed to optional
        "string.empty": "Product Name cannot be empty.",
        "string.min": "Product Name must be at least 3 characters long.",
    }),

    description: Joi.string().min(10).optional().messages({ // Changed to optional
        "string.empty": "Description cannot be empty.",
        "string.min": "Description must be at least 10 characters long.",
    }),

    brand: Joi.string().allow('').optional().messages({ // Changed to optional
        "string.hex": "Invalid Brand ID format.",
    }),

    category: Joi.string().allow('').optional().messages({ // Changed to optional
        "string.hex": "Invalid Category ID format.",
    }),

    targetedAudience: Joi.string().trim().allow(null, "").optional(),

    tags: Joi.string().trim().allow(null, "").optional(),

    rating: Joi.number().min(1).max(5).allow(null, "").optional(),

    // The variants array itself is optional when editing (e.g., only updating product name)
    // If provided, it must be an array of variants.
    variants: Joi.array().items(variantJoiSchema).optional(),
});

export { editProductJoiSchema };