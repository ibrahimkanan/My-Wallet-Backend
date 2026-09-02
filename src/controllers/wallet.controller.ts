import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    createWallet as createWalletRepo,
    getWalletsByUser,
    getWalletById,
    updateWallet as updateWalletRepo,
    deleteWallet as deleteWalletRepo,
} from "../repositories/wallet.repo.js";

export const createWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { name, type } = req.body;

        const wallet = await createWalletRepo(userId, name, type);
        return res.status(201).json({
            status: "ok",
            wallet,
        });
    } catch (error) {
        console.error("Error creating wallet:", error);
        return res.status(500).json({ error: "Failed to create wallet" });
    }
};

export const getWallets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const wallets = await getWalletsByUser(userId);
        res.json({ status: "ok", wallets });
    } catch (error) {
        console.error("Error getting wallets:", error);
        return res.status(500).json({ error: "Failed to get wallets" });
    }
};

export const updateWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid id" });
        }

        const existing = await getWalletById(id, userId);

        if (!existing) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const wallet = await updateWalletRepo(id, userId, req.body);
        return res.status(200).json({ status: "ok", wallet });
    } catch (error) {
        console.error("Error updating wallet:", error);
        return res.status(500).json({ error: "Failed to update wallet" });
    }
};

export const deleteWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid id" });
        }

        const existing = await getWalletById(id, userId);
        if (!existing) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        await deleteWalletRepo(id, userId);
        res.json({ status: "ok", message: "Wallet deleted" });
    } catch (error) {
        console.error("Error deleting wallet:", error);
        res.status(500).json({ error: "Failed to delete wallet" });
    }
};
