import express from "express";
import {
    requestOtp,
    refreshToken,
    verifyOtp,
    logout,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import {
    refreshTokenSchema,
    requestOtpSchema,
    verifyOtpSchema,
} from "../schemas/auth.schema.js";

const router = express.Router();

router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/refresh", validate(refreshTokenSchema), refreshToken);
router.post("/logout", validate(refreshTokenSchema), logout);

export default router;

// 648581148d417a1aee9206db2ee91a9adf019e538a2cb1f14be0b18b03a7c37ed2f253c30f0239e5