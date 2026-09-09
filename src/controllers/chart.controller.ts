import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    getMonthlyTotals,
    getMonthlyBreakdownByCategory,
    getYearlyTotals,
} from "../repositories/chart.repo.js";

export const getMonthlyChart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        const totals = await getMonthlyTotals(userId, month, year);
        const by_category = await getMonthlyBreakdownByCategory(
            userId,
            month,
            year,
        );

        return res.status(200).json({
            status: "ok",
            summary: {
                month,
                year,
                total_income: totals.total_income,
                total_expense: totals.total_expense,
                net: totals.total_income - totals.total_expense,
                by_category,
            },
        });
    } catch (error) {
        console.error("Error getting monthly chart:", error);
        return res.status(500).json({ error: "Failed to get monthly chart" });
    }
};

export const getYearlyChart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const year = Number(req.query.year);

        const by_month = await getYearlyTotals(userId, year);
        const total_income = by_month.reduce(
            (sum, m) => sum + m.total_income,
            0,
        );
        const total_expense = by_month.reduce(
            (sum, m) => sum + m.total_expense,
            0,
        );

        return res.status(200).json({
            status: "ok",
            summary: {
                year,
                total_income,
                total_expense,
                net: total_income - total_expense,
                by_month,
            },
        });
    } catch (error) {
        console.error("Error getting yearly chart:", error);
        return res.status(500).json({ error: "Failed to get yearly chart" });
    }
};
