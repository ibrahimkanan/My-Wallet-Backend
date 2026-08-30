import pool from "../config/db.js";

export const createOtpCode = async (
    email: string,
    codeHash: string,
    expiresAt: Date,
) => {
    await pool.query(
        `INSERT INTO otp_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
        [email, codeHash, expiresAt],
    );
};

export const getLatestOtpForEmail = async (email: string) => {
    const result = await pool.query(
        `SELECT * FROM otp_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
        [email]
    )
    return result.rows[0] ?? null
}