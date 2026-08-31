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
