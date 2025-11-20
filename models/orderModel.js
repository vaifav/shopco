import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "product",
			required: true,
		},
		variantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "variant",
			required: true,
		},
		name: { type: String, required: true },
		price: { type: Number, required: true },
		quantity: { type: Number, required: true },
		size: { type: String },
		color: { type: String },
		imageUrl: { type: String },
		itemStatus: {
			type: String,
			required: true,
			default: "Pending",
			enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
		},
		reason: { type: String },
		refundedAmount: { type: Number, default: 0 },
	},
	{ _id: true }
);

const ShippingAddressSchema = new mongoose.Schema(
	{
		fullName: { type: String, required: true },
		phone: { type: String, required: true },
		country: { type: String, required: true },
		state: { type: String, required: true },
		city: { type: String, required: true },
		street: { type: String, required: true },
		houseName: { type: String, required: true },
		pin: { type: String, required: true },
		addressId: { type: mongoose.Schema.Types.ObjectId, ref: "address" },
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			required: true,
			index: true,
		},
		items: [OrderItemSchema],
		shippingAddress: {
			type: ShippingAddressSchema,
			required: true,
		},
		paymentMethod: {
			type: String,
			required: true,
			enum: ["COD", "CARD", "PAYPAL", "GOOGLE_PAY"],
		},
		totalAmount: {
			type: Number,
			required: true,
		},
		returnReason: { type: String },
	},
	{
		timestamps: true,
	}
);

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;
