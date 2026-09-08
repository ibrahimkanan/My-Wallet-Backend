import pool from "../config/db.js";
import type { Budget } from "../types/budget.types.js";

export const createBudget = async (
    userId: string,
    data: { category_id?: string; amount: number; month: number; year: number },
): Promise<Budget> => {
    if (data.category_id) {
        const catCheck = await pool.query(
            `SELECT id FROM categories WHERE id = $1 AND user_id = $2`,
            [data.category_id, userId],
        );
        if (catCheck.rows.length === 0) {
            throw new Error("CATEGORY_NOT_FOUND");
        }
    }

    const result = await pool.query<Budget>(
        `INSERT INTO budgets (user_id, category_id, amount, month, year)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, data.category_id ?? null, data.amount, data.month, data.year],
    );
    return result.rows[0];
};

export const getBudgetsForPeriod = async (
    userId: string,
    month: number,
    year: number,
): Promise<Budget[]> => {
    const result = await pool.query<Budget>(
        `SELECT * FROM budgets
         WHERE user_id = $1 AND month = $2 AND year = $3
         ORDER BY category_id NULLS FIRST`, 
        [userId, month, year],
    );
    return result.rows;
};

export const getBudgetById = async (id: string, userId: string): Promise<Budget | null> => {
    const result = await pool.query<Budget>(
        `SELECT * FROM budgets WHERE id = $1 AND user_id = $2`,
        [id, userId],
    );
    return result.rows[0] ?? null;
};

export const updateBudget = async (
    id: string,
    userId: string,
    amount: number,
): Promise<Budget | null> => {
    const result = await pool.query<Budget>(
        `UPDATE budgets SET amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
        [amount, id, userId],
    );
    return result.rows[0] ?? null;
};

export const deleteBudget = async (id: string, userId: string): Promise<boolean> => {
    const result = await pool.query(`DELETE FROM budgets WHERE id = $1 AND user_id = $2`, [
        id,
        userId,
    ]);
    return (result.rowCount ?? 0) > 0;
};

export const getOrCreateOverallBudget = async (
    userId: string,
    month: number,
    year: number,
): Promise<Budget | null> => {
    const existing = await pool.query<Budget>(
        `SELECT * FROM budgets
         WHERE user_id = $1 AND month = $2 AND year = $3 AND category_id IS NULL`,
        [userId, month, year],
    );
    if (existing.rows[0]) {
        return existing.rows[0];
    }

    const userResult = await pool.query<{ default_monthly_budget: string | null }>(
        `SELECT default_monthly_budget FROM users WHERE id = $1`,
        [userId],
    );
    const defaultAmount = userResult.rows[0]?.default_monthly_budget;

    if (defaultAmount === null || defaultAmount === undefined) {
        return null; 
    }

    const created = await pool.query<Budget>(
        `INSERT INTO budgets (user_id, category_id, amount, month, year)
         VALUES ($1, NULL, $2, $3, $4)
         RETURNING *`,
        [userId, defaultAmount, month, year],
    );
    return created.rows[0];
};

export const getSpentForPeriod = async (
    userId: string,
    month: number,
    year: number,
    categoryId?: string | null,
): Promise<number> => {
    const conditions = [
        `user_id = $1`,
        `type = 'expense'`,
        `EXTRACT(MONTH FROM transaction_date) = $2`,
        `EXTRACT(YEAR FROM transaction_date) = $3`,
    ];
    const values: unknown[] = [userId, month, year];

    if (categoryId) {
        conditions.push(`category_id = $4`);
        values.push(categoryId);
    }

    const result = await pool.query<{ spent: string }>(
        `SELECT COALESCE(SUM(amount), 0) as spent FROM transactions WHERE ${conditions.join(" AND ")}`,
        values,
    );
    return Number(result.rows[0].spent);
};