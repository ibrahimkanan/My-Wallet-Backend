import express from "express";
import { requestOtp } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/request-otp", requestOtp);
// router.post("/verify-otp", verifyOtp)
// router.patch("/update-profile", updateProfile)
// router.post("/refresh-token", refreshToken)
// router.post("/logout", logout)

export default router;
