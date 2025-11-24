import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema(
	{
		walletId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "wallet",
			required: true,
			index: true,
		},
		amount: { type: Number, required: true },
		type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
		source: { type: String, enum: ["REFUND", "ORDER", "WITHDRAWAL", "BONUS"], required: true },
		referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
		externalTransactionId: { type: String, default: null },
		status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], default: "COMPLETED" },
	},
	{ timestamps: true }
);

const WalletTransactionModel = mongoose.model("WalletTransaction", WalletTransactionSchema);
export default WalletTransactionModel;
