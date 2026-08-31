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

export const findRefreshTokenByHash = async (tokenHash: string) => {
    const result = await pool.query(
        "SELECT * FROM refresh_tokens WHERE token_hash = $1",
        [tokenHash],
    );
    return result.rows[0] ?? null;
};

export const revokeRefreshToken = async (tokenHash: string) => {
    await pool.query(
        "UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1",
        [tokenHash],
    );
};
