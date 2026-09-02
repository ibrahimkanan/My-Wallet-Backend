import pool from "../config/db.js";

export interface User {
    id: string;
    name: string | null;
    email: string;
    password_hash: string | null;
    created_at: Date;
    updated_at: Date;
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
        email,
    ]);
    return result.rows[0] ?? null;
};

export const createUser = async (email: string) => {
    const result = await pool.query<User>(
        `INSERT INTO users (email) VALUES ($1) RETURNING *`,
        [email],
    );
    return result.rows[0];
};

export async function updateUserProfile(
    userId: string,
    updates: {
        name?: string;
        password_hash?: string;
        default_monthly_budget?: number;
    },
): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(updates.name);
    }
    if (updates.password_hash !== undefined) {
        fields.push(`password_hash = $${idx++}`);
        values.push(updates.password_hash);
    }
    if (updates.default_monthly_budget !== undefined) {
        fields.push(`default_monthly_budget = $${idx++}`);
        values.push(updates.default_monthly_budget);
    }

    if (fields.length === 0) {
        throw new Error("No fields to update");
    }

    fields.push(`updated_at = now()`);
    values.push(userId);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    console.log("DEBUG QUERY:", query);
    const result = await pool.query<User>(query, values);
    return result.rows[0];
}
