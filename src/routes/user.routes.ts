import express from "express";
import { updateProfile } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/user.schema.js";

const router = express.Router();

router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);

export default router;
