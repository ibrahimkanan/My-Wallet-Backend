import express from "express";
import {
    requestOtp,
    refreshToken,
    verifyOtp,
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

export default router;
