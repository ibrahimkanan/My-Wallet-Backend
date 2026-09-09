import pool from "../config/db.js";
import type { CategoryBreakdown, MonthlyPoint } from "../types/chart.types.js";

export const getMonthlyTotals = async (
    userId: string,
    month: number,
    year: number,
): Promise<{ total_income: number; total_expense: number }> => {
    const result = await pool.query<{ type: string; total: string }>(
        `SELECT type, COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE user_id = $1
         AND EXTRACT(MONTH FROM transaction_date) = $2
         AND EXTRACT(YEAR FROM transaction_date) = $3
         GROUP BY type`,
        [userId, month, year],
    );

    let total_income = 0;
    let total_expense = 0;
    for (const row of result.rows) {
        if (row.type === "income") total_income = Number(row.total);
        if (row.type === "expense") total_expense = Number(row.total);
    }
    return { total_income, total_expense };
};

export const getMonthlyBreakdownByCategory = async (
    userId: string,
    month: number,
    year: number,
): Promise<CategoryBreakdown[]> => {
    const result = await pool.query<{
        category_id: string | null;
        category_name: string | null;
        total: string;
    }>(
        `SELECT t.category_id, c.name as category_name, COALESCE(SUM(t.amount), 0) as total
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.user_id = $1
         AND t.type = 'expense'
         AND EXTRACT(MONTH FROM t.transaction_date) = $2
         AND EXTRACT(YEAR FROM t.transaction_date) = $3
         GROUP BY t.category_id, c.name
         ORDER BY total DESC`,
        [userId, month, year],
    );

    return result.rows.map((row) => ({
        category_id: row.category_id,
        category_name: row.category_name,
        total: Number(row.total),
    }));
};

export const getYearlyTotals = async (
    userId: string,
    year: number,
): Promise<MonthlyPoint[]> => {
    const result = await pool.query<{
        month: number;
        type: string;
        total: string;
    }>(
        `SELECT EXTRACT(MONTH FROM transaction_date)::int as month, type, COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE user_id = $1
         AND EXTRACT(YEAR FROM transaction_date) = $2
         GROUP BY month, type`,
        [userId, year],
    );

    const monthMap = new Map<
        number,
        { total_income: number; total_expense: number }
    >();
    for (let m = 1; m <= 12; m++) {
        monthMap.set(m, { total_income: 0, total_expense: 0 });
    }

    for (const row of result.rows) {
        const entry = monthMap.get(row.month)!;
        if (row.type === "income") entry.total_income = Number(row.total);
        if (row.type === "expense") entry.total_expense = Number(row.total);
    }

    return Array.from(monthMap.entries()).map(([month, totals]) => ({
        month,
        total_income: totals.total_income,
        total_expense: totals.total_expense,
        net: totals.total_income - totals.total_expense,
    }));
};
