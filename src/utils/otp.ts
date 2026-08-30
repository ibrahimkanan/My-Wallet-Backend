import crypto from "crypto";
import bcrypt from "bcrypt";

export const generateOtp = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

export const hashOtpCode = (otp: string): string => {
    return bcrypt.hashSync(otp, 10);
};
