import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: String,

		discountType: {
			type: String,
			required: true,
			enum: ["percentage", "fixedAmount"],
		},
		discountValue: {
			type: Number,
			required: true,
			min: 0,
		},
		maxDiscountAmount: {
			type: Number,
			default: null,
			min: 0,
		},

		maxGlobalUses: {
			type: Number,
			default: Infinity,
			min: 0,
		},
		usedCount: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		maxUsesPerUser: {
			type: Number,
			default: 1,
			min: 1,
		},

		startDate: { type: Date, required: true },
		expiryDate: { type: Date, required: true },
		isActive: { type: Boolean, default: true },
		isDeleted: { type: Boolean, default: false },
		minPurchaseAmount: { type: Number, default: 0, min: 0 },

		restrictionScope: {
			type: String,
			enum: ["none", "includeProducts", "excludeProducts", "includeCategories", "excludeCategories"],
			default: "none",
		},

		productRestrictionList: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "product",
			},
		],
		categoryRestrictionList: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "category",
			},
		],
		usersWhoUsed: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "signup", required: true },
				count: { type: Number, default: 0, required: true },
			},
		],
	},
	{ timestamps: true }
);

const couponModel = mongoose.model("coupon", couponSchema);
export default couponModel;
