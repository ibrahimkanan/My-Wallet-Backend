import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    createTransaction as createTransactionRepo,
    getTransactions as getTransactionsRepo,
    updateTransaction as updateTransactionRepo,
    deleteTransaction as deleteTransactionRepo,
} from "../repositories/transaction.repo.js";

function handleKnownErrors(error: any, res: Response) {
    if (error.message === "WALLET_NOT_FOUND") {
        return res.status(404).json({ error: "Wallet not found" });
    }
    if (error.message === "CATEGORY_NOT_FOUND") {
        return res.status(404).json({ error: "Category not found" });
    }
    return null;
}

export const createTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const transaction = await createTransactionRepo(userId, req.body);
        return res.status(201).json({ status: "ok", transaction });
    } catch (error: any) {
        console.error("Error creating transaction:", error);
        const handled = handleKnownErrors(error, res);
        if (handled) return handled;
        return res.status(500).json({ error: "Failed to create transaction" });
    }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { wallet_id, category_id, month, year, limit, offset } = req.query;

        const transactions = await getTransactionsRepo(userId, {
            wallet_id: wallet_id as string | undefined,
            category_id: category_id as string | undefined,
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });

        return res.status(200).json({ status: "ok", transactions });
    } catch (error) {
        console.error("Error getting transactions:", error);
        return res.status(500).json({ error: "Failed to get transactions" });
    }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };

        const transaction = await updateTransactionRepo(id, userId, req.body);
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        return res.status(200).json({ status: "ok", transaction });
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        const handled = handleKnownErrors(error, res);
        if (handled) return handled;
        return res.status(500).json({ error: "Failed to update transaction" });
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };

        const deleted = await deleteTransactionRepo(id, userId);
        if (!deleted) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        return res.status(200).json({ status: "ok", message: "Transaction deleted" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return res.status(500).json({ error: "Failed to delete transaction" });
    }
};