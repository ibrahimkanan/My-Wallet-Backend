import express from "express";
import {
    createWallet,
    getWallets,
    updateWallet,
    deleteWallet,
} from "../controllers/wallet.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
    createWalletSchema,
    updateWalletSchema,
} from "../schemas/wallet.schema.js";

const router = express.Router();

router.post("/", requireAuth, validate(createWalletSchema), createWallet);
router.get("/", requireAuth, getWallets);
router.patch("/:id", requireAuth, validate(updateWalletSchema), updateWallet);
router.delete("/:id", requireAuth, deleteWallet);

export default router;
