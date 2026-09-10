import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    createRecurringTransaction as createRepo,
    getRecurringTransactionsByUser,
    getRecurringTransactionById,
    updateRecurringTransaction as updateRepo,
    deleteRecurringTransaction as deleteRepo,
    processAllDueRecurringTransactions,
} from "../repositories/recurringTransaction.repo.js";

function handleKnownErrors(error: any, res: Response) {
    if (error.message === "WALLET_NOT_FOUND")
        return res.status(404).json({ error: "Wallet not found" });
    if (error.message === "CATEGORY_NOT_FOUND")
        return res.status(404).json({ error: "Category not found" });
    return null;
}

export const createRecurringTransaction = async (
    req: AuthRequest,
    res: Response,
) => {
    try {
        const userId = req.userId as string;
        const recurring = await createRepo(userId, req.body);
        return res.status(201).json({ status: "ok", recurring });
    } catch (error: any) {
        console.error("Error creating recurring transaction:", error);
        const handled = handleKnownErrors(error, res);
        if (handled) return handled;
        return res
            .status(500)
            .json({ error: "Failed to create recurring transaction" });
    }
};

export const getRecurringTransactions = async (
    req: AuthRequest,
    res: Response,
) => {
    try {
        const userId = req.userId as string;
        const recurring = await getRecurringTransactionsByUser(userId);
        return res.status(200).json({ status: "ok", recurring });
    } catch (error) {
        console.error("Error getting recurring transactions:", error);
        return res
            .status(500)
            .json({ error: "Failed to get recurring transactions" });
    }
};

export const updateRecurringTransaction = async (
    req: AuthRequest,
    res: Response,
) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };

        const existing = await getRecurringTransactionById(id, userId);
        if (!existing)
            return res
                .status(404)
                .json({ error: "Recurring transaction not found" });

        const recurring = await updateRepo(id, userId, req.body);
        return res.status(200).json({ status: "ok", recurring });
    } catch (error) {
        console.error("Error updating recurring transaction:", error);
        return res
            .status(500)
            .json({ error: "Failed to update recurring transaction" });
    }
};

export const deleteRecurringTransaction = async (
    req: AuthRequest,
    res: Response,
) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };

        const existing = await getRecurringTransactionById(id, userId);
        if (!existing)
            return res
                .status(404)
                .json({ error: "Recurring transaction not found" });

        await deleteRepo(id, userId);
        return res
            .status(200)
            .json({ status: "ok", message: "Recurring transaction deleted" });
    } catch (error) {
        console.error("Error deleting recurring transaction:", error);
        return res
            .status(500)
            .json({ error: "Failed to delete recurring transaction" });
    }
};

export const runDueCheck = async (req: AuthRequest, res: Response) => {
    try {
        const processedCount = await processAllDueRecurringTransactions();
        return res
            .status(200)
            .json({ status: "ok", processed: processedCount });
    } catch (error) {
        console.error("Error running due check:", error);
        return res.status(500).json({ error: "Failed to run due check" });
    }
};
