import { Resend } from "resend";
import { OTP_EMAIL_TEMPLATE } from "./emailTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (toEmail: string, code: string) => {
    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: toEmail,
            subject: "Your My Wallet OTP Code",
            html: OTP_EMAIL_TEMPLATE.replace("{code}", code),
        });
        console.log("OTP email sent successfully to:", toEmail);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
};
