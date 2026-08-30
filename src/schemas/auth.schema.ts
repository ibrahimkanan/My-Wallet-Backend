import { z } from "zod";

export const requestOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().length(6, "OTP code must be 6 digits"),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
