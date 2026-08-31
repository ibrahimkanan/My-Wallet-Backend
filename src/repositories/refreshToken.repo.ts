import pool from "../config/db.js";

export const storeRefreshToken = async (
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    deviceInfo?: string,
) => {
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
        VALUES ($1, $2, $3, $4)`,
        [userId, tokenHash, expiresAt, deviceInfo],
    );
};
