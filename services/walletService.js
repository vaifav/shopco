import WalletModel from "../models/walletModel.js";
import WalletTransactionModel from "../models/walletTransactionModel.js";
import mongoose from "mongoose";

const creditWallet = async (userId, amount, source, referenceId) => {
    if (amount <= 0) {
        throw new Error("Credit amount must be positive.");
    }

    const wallet = await WalletModel.findOneAndUpdate(
        { user: userId },
        {
            $inc: { balance: amount },
        },
        {
            new: true,
            upsert: true,
        }
    );

    if (!wallet) {
        throw new Error("Failed to find or create wallet.");
    }

    const objectReferenceId = new mongoose.Types.ObjectId(referenceId);
    const uniqueTransactionId = `WALLET_CR_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 7)}`;

    const newTransaction = new WalletTransactionModel({
        walletId: wallet._id,
        amount: amount,
        type: "CREDIT",
        source: source,
        referenceId: objectReferenceId,
        externalTransactionId: uniqueTransactionId,
        status: "COMPLETED",
    });

    await newTransaction.save();
    await WalletModel.updateOne({ _id: wallet._id }, { $push: { transactions: newTransaction._id } });

    return uniqueTransactionId;
};

const debitWallet = async (userId, amount, source, referenceId) => {
    if (amount <= 0) {
        throw new Error("Debit amount must be positive.");
    }
    
    const wallet = await WalletModel.findOne({ user: userId });
    
    if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient wallet balance.");
    }

    const updatedWallet = await WalletModel.findOneAndUpdate(
        { user: userId },
        { 
            $inc: { balance: -amount } 
        },
        { 
            new: true 
        }
    );

    if (!updatedWallet) {
        throw new Error("Failed to update wallet balance.");
    }

    const objectReferenceId = new mongoose.Types.ObjectId(referenceId);
    const uniqueTransactionId = `WALLET_DB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTransaction = new WalletTransactionModel({
        walletId: updatedWallet._id, 
        amount: amount,
        type: "DEBIT",
        source: source,
        referenceId: objectReferenceId,
        externalTransactionId: uniqueTransactionId,
        status: "COMPLETED",
    });

    await newTransaction.save();
    await WalletModel.updateOne(
        { _id: updatedWallet._id },
        { $push: { transactions: newTransaction._id } }
    );

    return uniqueTransactionId;
};

const getWalletDetails = async (userId, page = 1, limit = 5) => {
    try {
        const wallet = await WalletModel.findOne({ user: userId }).lean();

        if (!wallet) {
            return {
                balance: 0,
                transactions: [],
                page: 1,
                limit: 1,
                totalPages: 1,
            };
        }

        const total = wallet.transactions.length;
        const totalPages = Math.ceil(total / limit);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages || 1;
        let skip = (page - 1) * limit;
        const populatedWallet = await WalletModel.findOne({ user: userId })
            .select("balance transactions")
            .populate({
                path: "transactions",
                model: "WalletTransaction",
                options: { sort: { createdAt: -1 }, skip, limit },
            })
            .lean();

        return {
            balance: populatedWallet.balance,
            transactions: populatedWallet.transactions,
            page,
            limit,
            totalPages,
        };
    } catch (error) {
        throw new Error(`Failed to fetch wallet details: ${error.message}`);
    }
};

export { creditWallet, debitWallet, getWalletDetails };