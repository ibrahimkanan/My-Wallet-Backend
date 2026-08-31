import express from "express";
import { requestOtp, verifyOtp } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requestOtpSchema, verifyOtpSchema } from "../schemas/auth.schema.js";

const router = express.Router();

router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

export default router;
