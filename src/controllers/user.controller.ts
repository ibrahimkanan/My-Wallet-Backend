import type { Response } from "express";
import bcrypt from "bcrypt";
import { updateUserProfile } from "../repositories/user.repo.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, password, default_monthly_budget } = req.body;
        const userId = req.userId as string;

        console.log("DEBUG userId from token:", userId); // مؤقت

        const updates: {
            name?: string;
            password_hash?: string;
            default_monthly_budget?: number;
        } = {};

        if (name) updates.name = name;

        if (password) {
            updates.password_hash = await bcrypt.hash(password, 10);
        }

        if (default_monthly_budget)
            updates.default_monthly_budget = default_monthly_budget;

        const user = await updateUserProfile(userId, updates);

        return res.status(200).json({
            status: "ok",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
