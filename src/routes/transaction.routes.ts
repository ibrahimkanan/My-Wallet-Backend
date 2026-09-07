import express from "express";
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
} from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate, validateParams } from "../middleware/validate.js";
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionIdParamSchema,
} from "../schemas/transaction.schema.js";

const router = express.Router();

router.post(
    "/",
    requireAuth,
    validate(createTransactionSchema),
    createTransaction,
);
router.get("/", requireAuth, getTransactions);
router.patch(
    "/:id",
    requireAuth,
    validateParams(transactionIdParamSchema),
    validate(updateTransactionSchema),
    updateTransaction,
);
router.delete(
    "/:id",
    requireAuth,
    validateParams(transactionIdParamSchema),
    deleteTransaction,
);

export default router;
