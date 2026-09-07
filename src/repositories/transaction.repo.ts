import pool from "../config/db.js";
import type {
    Transaction,
    TransactionType,
} from "../types/transaction.types.js";

export const createTransaction = async (
    userId: string,
    data: {
        wallet_id: string;
        category_id?: string;
        type: TransactionType;
        amount: number;
        note?: string;
        transaction_date: string;
    },
): Promise<Transaction> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const walletCheck = await client.query(
            `SELECT id FROM wallets WHERE id = $1 AND user_id = $2`,
            [data.wallet_id, userId],
        );
        if (walletCheck.rows.length === 0) {
            throw new Error("WALLET_NOT_FOUND");
        }
        if (data.category_id) {
            const catCheck = await client.query(
                `SELECT id FROM categories WHERE id = $1 AND user_id = $2`,
                [data.category_id, userId],
            );
            if (catCheck.rows.length === 0) {
                throw new Error("CATEGORY_NOT_FOUND");
            }
        }

        const inserted = await client.query<Transaction>(
            `INSERT INTO transactions (user_id, wallet_id, category_id, type, amount, note, transaction_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                data.wallet_id,
                data.category_id ?? null,
                data.type,
                data.amount,
                data.note ?? null,
                data.transaction_date,
            ],
        );

        const balanceChange =
            data.type === "income" ? data.amount : -data.amount;
        await client.query(
            `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
            [balanceChange, data.wallet_id],
        );

        await client.query("COMMIT");
        return inserted.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const getTransactions = async (
    userId: string,
    filters: {
        wallet_id?: string;
        category_id?: string;
        month?: number;
        year?: number;
        limit?: number;
        offset?: number;
    },
): Promise<Transaction[]> => {
    const conditions: string[] = ["user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (filters.wallet_id) {
        conditions.push(`wallet_id = $${idx++}`);
        values.push(filters.wallet_id);
    }
    if (filters.category_id) {
        conditions.push(`category_id = $${idx++}`);
        values.push(filters.category_id);
    }
    if (filters.month && filters.year) {
        conditions.push(
            `EXTRACT(MONTH FROM transaction_date) = $${idx++} AND EXTRACT(YEAR FROM transaction_date) = $${idx++}`,
        );
        values.push(filters.month, filters.year);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    values.push(limit, offset);

    const query = `
        SELECT * FROM transactions
        WHERE ${conditions.join(" AND ")}
        ORDER BY transaction_date DESC, created_at DESC
        LIMIT $${idx++} OFFSET $${idx}
    `;

    const result = await pool.query<Transaction>(query, values);
    return result.rows;
};

export const getTransactionById = async (
    id: string,
    userId: string,
): Promise<Transaction | null> => {
    const result = await pool.query<Transaction>(
        `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`,
        [id, userId],
    );
    return result.rows[0] ?? null;
};

export const updateTransaction = async (
    id: string,
    userId: string,
    updates: {
        wallet_id?: string;
        category_id?: string | null;
        type?: TransactionType;
        amount?: number;
        note?: string | null;
        transaction_date?: string;
    },
): Promise<Transaction | null> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingResult = await client.query<Transaction>(
            `SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
            [id, userId],
        );
        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
        }
        const existing = existingResult.rows[0];

        const newWalletId = updates.wallet_id ?? existing.wallet_id;
        const newType = updates.type ?? existing.type;
        const newAmount = updates.amount ?? Number(existing.amount);

        if (updates.wallet_id && updates.wallet_id !== existing.wallet_id) {
            const walletCheck = await client.query(
                `SELECT id FROM wallets WHERE id = $1 AND user_id = $2`,
                [updates.wallet_id, userId],
            );
            if (walletCheck.rows.length === 0)
                throw new Error("WALLET_NOT_FOUND");
        }

        if (updates.category_id) {
            const catCheck = await client.query(
                `SELECT id FROM categories WHERE id = $1 AND user_id = $2`,
                [updates.category_id, userId],
            );
            if (catCheck.rows.length === 0)
                throw new Error("CATEGORY_NOT_FOUND");
        }

        const oldEffect =
            existing.type === "income"
                ? -Number(existing.amount)
                : Number(existing.amount);
        await client.query(
            `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
            [oldEffect, existing.wallet_id],
        );

        const newEffect = newType === "income" ? newAmount : -newAmount;
        await client.query(
            `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
            [newEffect, newWalletId],
        );

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
        if (updates.type !== undefined) {
            fields.push(`type = $${idx++}`);
            values.push(updates.type);
        }
        if (updates.amount !== undefined) {
            fields.push(`amount = $${idx++}`);
            values.push(updates.amount);
        }
        if (updates.note !== undefined) {
            fields.push(`note = $${idx++}`);
            values.push(updates.note);
        }
        if (updates.transaction_date !== undefined) {
            fields.push(`transaction_date = $${idx++}`);
            values.push(updates.transaction_date);
        }

        values.push(id, userId);
        const query = `UPDATE transactions SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
        const result = await client.query<Transaction>(query, values);

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const deleteTransaction = async (
    id: string,
    userId: string,
): Promise<boolean> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingResult = await client.query<Transaction>(
            `SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
            [id, userId],
        );
        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return false;
        }
        const existing = existingResult.rows[0];

        const reverseEffect =
            existing.type === "income"
                ? -Number(existing.amount)
                : Number(existing.amount);
        await client.query(
            `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
            [reverseEffect, existing.wallet_id],
        );

        await client.query(`DELETE FROM transactions WHERE id = $1`, [id]);

        await client.query("COMMIT");
        return true;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
