import { Request, Response } from "express";
import { generateOtp, hashOtpCode } from "../utils/otp.js";
import {
    createOtpCode,
    getLatestOtpForEmail,
} from "../repositories/otp.repo.js";
import { sendOtpEmail } from "../utils/email.js";

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

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
export const verifyOtp = async (req: Request, res: Response) => {};
export const updateProfile = async (req: Request, res: Response) => {};
export const refreshToken = async (req: Request, res: Response) => {};
export const logout = async (req: Request, res: Response) => {};
