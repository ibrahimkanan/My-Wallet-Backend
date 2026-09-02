import pool from "../config/db.js";

export interface Wallet {
    id: string;
    user_id: string;
    name: string | null;
    type: "cash" | "bank" | "card";
    balance: string;
    created_at: Date;
}

export const createWallet = async (
    userId: string,
    name: string,
    type: string,
): Promise<Wallet> => {
    const result = await pool.query<Wallet>(
        `INSERT INTO wallets (user_id, name, type) VALUES ($1, $2, $3) RETURNING *`,
        [userId, name, type],
    );
    return result.rows[0];
};

export const getWalletsByUser = async (userId: string): Promise<Wallet[]> => {
    const result = await pool.query<Wallet>(
        `SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
    );
    return result.rows;
};

export const getWalletById = async (
    walletId: string,
    userId: string,
): Promise<Wallet | null> => {
    const result = await pool.query<Wallet>(
        `SELECT * FROM wallets WHERE id = $1 AND user_id = $2`,
        [walletId, userId],
    );

    return result.rows[0] ?? null;
};

export const updateWallet = async (
    walletId: string,
    userId: string,
    updates: {
        name?: string;
        type?: string;
    },
): Promise<Wallet> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(updates.name);
    }

    if (updates.type !== undefined) {
        fields.push(`type = $${idx++}`);
        values.push(updates.type);
    }

    if (fields.length === 0) {
        throw new Error("No fields to update");
    }

    values.push(walletId, userId);

    const query = `UPDATE wallets SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
    const result = await pool.query<Wallet>(query, values);

    if (!result.rows[0]) {
        throw new Error("Wallet not found");
    }

    return result.rows[0];
};

export const deleteWallet = async (
    walletId: string,
    userId: string,
): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM wallets WHERE id = $1 AND user_id = $2`,
        [walletId, userId],
    );
    return (result.rowCount ?? 0) > 0;
};
