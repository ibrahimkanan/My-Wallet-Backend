import pool from "../config/db.js";
import type {
    RecurringTransaction,
    RecurrenceFrequency,
} from "../types/recurringTransaction.types.js";

export const createRecurringTransaction = async (
    userId: string,
    data: {
        wallet_id: string;
        category_id?: string;
        type: "income" | "expense";
        amount: number;
        note?: string;
        frequency: RecurrenceFrequency;
        start_date: string;
        end_date?: string;
    },
): Promise<RecurringTransaction> => {
    const walletCheck = await pool.query(
        `SELECT id FROM wallets WHERE id = $1 AND user_id = $2`,
        [data.wallet_id, userId],
    );
    if (walletCheck.rows.length === 0) throw new Error("WALLET_NOT_FOUND");

    if (data.category_id) {
        const catCheck = await pool.query(
            `SELECT id FROM categories WHERE id = $1 AND user_id = $2`,
            [data.category_id, userId],
        );
        if (catCheck.rows.length === 0) throw new Error("CATEGORY_NOT_FOUND");
    }

    const result = await pool.query<RecurringTransaction>(
        `INSERT INTO recurring_transactions
            (user_id, wallet_id, category_id, type, amount, note, frequency, start_date, end_date, next_due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $8)
         RETURNING *`,
        [
            userId,
            data.wallet_id,
            data.category_id ?? null,
            data.type,
            data.amount,
            data.note ?? null,
            data.frequency,
            data.start_date,
            data.end_date ?? null,
        ],
    );
    return result.rows[0];
};

export const getRecurringTransactionsByUser = async (
    userId: string,
): Promise<RecurringTransaction[]> => {
    const result = await pool.query<RecurringTransaction>(
        `SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
    );
    return result.rows;
};

export const getRecurringTransactionById = async (
    id: string,
    userId: string,
): Promise<RecurringTransaction | null> => {
    const result = await pool.query<RecurringTransaction>(
        `SELECT * FROM recurring_transactions WHERE id = $1 AND user_id = $2`,
        [id, userId],
    );
    return result.rows[0] ?? null;
};

export const updateRecurringTransaction = async (
    id: string,
    userId: string,
    updates: {
        wallet_id?: string;
        category_id?: string | null;
        amount?: number;
        note?: string | null;
        end_date?: string | null;
        is_active?: boolean;
    },
): Promise<RecurringTransaction | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.wallet_id !== undefined) {
        fields.push(`wallet_id = $${idx++}`);
        values.push(updates.wallet_id);
    }
    if (updates.category_id !== undefined) {
        fields.push(`category_id = $${idx++}`);
        values.push(updates.category_id);
    }
    if (updates.amount !== undefined) {
        fields.push(`amount = $${idx++}`);
        values.push(updates.amount);
    }
    if (updates.note !== undefined) {
        fields.push(`note = $${idx++}`);
        values.push(updates.note);
    }
    if (updates.end_date !== undefined) {
        fields.push(`end_date = $${idx++}`);
        values.push(updates.end_date);
    }
    if (updates.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(updates.is_active);
    }

    if (fields.length === 0) return null;

    values.push(id, userId);
    const query = `UPDATE recurring_transactions SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
    const result = await pool.query<RecurringTransaction>(query, values);
    return result.rows[0] ?? null;
};

export const deleteRecurringTransaction = async (
    id: string,
    userId: string,
): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2`,
        [id, userId],
    );
    return (result.rowCount ?? 0) > 0;
};

export const findDueRecurringTransactions = async (): Promise<
    RecurringTransaction[]
> => {
    const result = await pool.query<RecurringTransaction>(
        `SELECT * FROM recurring_transactions WHERE is_active = true AND next_due_date <= CURRENT_DATE`,
    );
    return result.rows;
};

function calculateNextDueDate(
    currentDateStr: string,
    frequency: RecurrenceFrequency,
): string {
    const [year, month, day] = currentDateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    switch (frequency) {
        case "daily":
            date.setUTCDate(date.getUTCDate() + 1);
            break;
        case "weekly":
            date.setUTCDate(date.getUTCDate() + 7);
            break;
        case "monthly":
            date.setUTCMonth(date.getUTCMonth() + 1);
            break;
        case "yearly":
            date.setUTCFullYear(date.getUTCFullYear() + 1);
            break;
    }
    return date.toISOString().split("T")[0];
}

export const processDueRecurringTransaction = async (
    recurring: RecurringTransaction,
): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `INSERT INTO transactions
                (user_id, wallet_id, category_id, recurring_transaction_id, type, amount, note, transaction_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                recurring.user_id,
                recurring.wallet_id,
                recurring.category_id,
                recurring.id,
                recurring.type,
                recurring.amount,
                recurring.note,
                recurring.next_due_date,
            ],
        );

        const balanceChange =
            recurring.type === "income"
                ? Number(recurring.amount)
                : -Number(recurring.amount);
        await client.query(
            `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
            [balanceChange, recurring.wallet_id],
        );

        const nextDue = calculateNextDueDate(
            recurring.next_due_date,
            recurring.frequency,
        );
        const isPastEndDate = recurring.end_date
            ? nextDue > recurring.end_date
            : false;

        await client.query(
            `UPDATE recurring_transactions SET next_due_date = $1, is_active = $2 WHERE id = $3`,
            [nextDue, !isPastEndDate, recurring.id],
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const processAllDueRecurringTransactions = async (): Promise<number> => {
    const due = await findDueRecurringTransactions();
    for (const recurring of due) {
        await processDueRecurringTransaction(recurring);
    }
    return due.length;
};
