import { Request, Response } from "express";
import { generateOtp, hashOtpCode } from "../utils/otp.js";
import {
    createOtpCode,
    getLatestOtpForEmail,
} from "../repositories/otp.repo.js";
import { sendOtpEmail } from "../utils/email.js";
import { verifyOtpCode } from "../utils/otp.js";
import {
    getValidOtpForEmail,
    markOtpAsConsumed,
} from "../repositories/otp.repo.js";
import { findUserByEmail, createUser } from "../repositories/user.repo.js";
import { signAccessToken } from "../utils/jwt.js";
import {
    generateRefreshToken,
    hashRefreshToken,
} from "../utils/refreshToken.js";
import {
    findRefreshTokenByHash,
    revokeRefreshToken,
    storeRefreshToken,
} from "../repositories/refreshToken.repo.js";
import { access } from "node:fs";

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const requestOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.status(400).json({ error: "Email is required" });
        }

        const lastOtp = await getLatestOtpForEmail(email);
        if (lastOtp) {
            const secondsSinceLast =
                (Date.now() - new Date(lastOtp.created_at).getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another OTP`,
                });
            }
        }

        const code = generateOtp();
        const codeHash = await hashOtpCode(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await createOtpCode(email, codeHash, expiresAt);
        await sendOtpEmail(email, code);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error requesting OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        const otpRecord = await getValidOtpForEmail(email);
        if (!otpRecord) {
            return res.status(400).json({ error: "OTP is invalid or expired" });
        }

        const isValid = await verifyOtpCode(code, otpRecord.code_hash);
        if (!isValid) {
            return res.status(400).json({ error: "OTP is invalid or expired" });
        }

        await markOtpAsConsumed(otpRecord.id);

        let user = await findUserByEmail(email);
        let isNewUser = false;

        if (!user) {
            user = await createUser(email);
            isNewUser = true;
        }
        const accessToken = signAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        const refreshExpiresAt = new Date(
            Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        );

        await storeRefreshToken(
            user.id,
            hashRefreshToken(refreshToken),
            refreshExpiresAt,
        );
        res.json({
            status: "ok",
            accessToken,
            refreshToken,
            isNewUser,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
};
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        const tokenHash = hashRefreshToken(refreshToken);

        const tokenRecord = await findRefreshTokenByHash(tokenHash);
        if (!tokenRecord) {
            return res
                .status(401)
                .json({ error: "Invalid or expired refresh token" });
        }

        await revokeRefreshToken(tokenRecord.id);

        const newRefreshToken = generateRefreshToken();
        const newEpiresAt = new Date(
            Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        );
        await storeRefreshToken(
            tokenRecord.user_id,
            hashRefreshToken(newRefreshToken),
            newEpiresAt,
        );

        const newAccessToken = signAccessToken(tokenRecord.user_id);

        res.json({
            status: "ok",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ error: "Failed to refresh token" });
    }
};
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        const tokenHash = hashRefreshToken(refreshToken);

        const tokenRecord = await findRefreshTokenByHash(tokenHash);
        if (!tokenRecord) {
            return res
                .status(401)
                .json({ error: "Invalid or expired refresh token" });
        }

        await revokeRefreshToken(tokenRecord.id);

        res.json({ status: "ok" });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ error: "Failed to log out" });
    }
};
 
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzZWNiMzkzYS1jODJhLTQ0NmItYWYzYS0zNmFiMTg2MWMzYjQiLCJpYXQiOjE3ODgyMDk3OTUsImV4cCI6MTc4ODIxMDY5NX0.U19sfMR2Oefdasxzc3WUpgTk0qluMurT7Jlichbs4nA