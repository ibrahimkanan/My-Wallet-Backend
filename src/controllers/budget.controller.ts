import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    createBudget as createBudgetRepo,
    getBudgetsForPeriod,
    getBudgetById,
    updateBudget as updateBudgetRepo,
    deleteBudget as deleteBudgetRepo,
    getOrCreateOverallBudget,
    getSpentForPeriod,
} from "../repositories/budget.repo.js";

function handleKnownErrors(error: any, res: Response) {
    if (error.message === "CATEGORY_NOT_FOUND") {
        return res.status(404).json({ error: "Category not found" });
    }
    if (error.code === "23505") {
        return res.status(400).json({
            error: "A budget already exists for this category and period",
        });
    }
    return null;
}

export const createBudget = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const budget = await createBudgetRepo(userId, req.body);
        return res.status(201).json({ status: "ok", budget });
    } catch (error: any) {
        console.error("Error creating budget:", error);
        const handled = handleKnownErrors(error, res);
        if (handled) return handled;
        return res.status(500).json({ error: "Failed to create budget" });
    }
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (!month || !year) {
            return res.status(400).json({ error: "month and year query params are required" });
        }

        await getOrCreateOverallBudget(userId, month, year);
        const budgets = await getBudgetsForPeriod(userId, month, year);
        return res.status(200).json({ status: "ok", budgets });
    } catch (error) {
        console.error("Error getting budgets:", error);
        return res.status(500).json({ error: "Failed to get budgets" });
    }
};

export const updateBudget = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };
        const { amount } = req.body;

        const existing = await getBudgetById(id, userId);
        if (!existing) {
            return res.status(404).json({ error: "Budget not found" });
        }

        const budget = await updateBudgetRepo(id, userId, amount);
        return res.status(200).json({ status: "ok", budget });
    } catch (error) {
        console.error("Error updating budget:", error);
        return res.status(500).json({ error: "Failed to update budget" });
    }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params as { id: string };

        const existing = await getBudgetById(id, userId);
        if (!existing) {
            return res.status(404).json({ error: "Budget not found" });
        }

        await deleteBudgetRepo(id, userId);
        return res.status(200).json({ status: "ok", message: "Budget deleted" });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return res.status(500).json({ error: "Failed to delete budget" });
    }
};

export const getBudgetSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (!month || !year) {
            return res.status(400).json({ error: "month and year query params are required" });
        }

        await getOrCreateOverallBudget(userId, month, year);
        const budgets = await getBudgetsForPeriod(userId, month, year);

        const summary = [];
        for (const budget of budgets) {
            const spent = await getSpentForPeriod(userId, month, year, budget.category_id);
            const budgeted = Number(budget.amount);
            summary.push({
                budget_id: budget.id,
                category_id: budget.category_id,
                budgeted,
                spent,
                remaining: budgeted - spent,
            });
        }

        return res.status(200).json({ status: "ok", summary });
    } catch (error) {
        console.error("Error getting budget summary:", error);
        return res.status(500).json({ error: "Failed to get budget summary" });
    }
};