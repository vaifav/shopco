import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "signup",
			required: true,
			unique: true,
			index: true,
		},
		balance: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		transactions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "WalletTransaction",
			},
		],
	},
	{ timestamps: true }
);

const WalletModel = mongoose.model("wallet", walletSchema);

export default WalletModel;
