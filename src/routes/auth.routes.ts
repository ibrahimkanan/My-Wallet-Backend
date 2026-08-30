import express from "express";
import { requestOtp } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requestOtpSchema } from "../schemas/auth.schema.js";

const router = express.Router();

router.post(
    "/request-otp",
    validate(requestOtpSchema),
    requestOtp
);
// router.post("/verify-otp", verifyOtp)
// router.patch("/update-profile", updateProfile)
// router.post("/refresh-token", refreshToken)
// router.post("/logout", logout)

export default router;
