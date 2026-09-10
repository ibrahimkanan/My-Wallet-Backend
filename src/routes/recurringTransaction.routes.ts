import express from "express";
import {
    createRecurringTransaction,
    getRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    runDueCheck,
} from "../controllers/recurringTransaction.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate, validateParams } from "../middleware/validate.js";
import {
    createRecurringTransactionSchema,
    updateRecurringTransactionSchema,
    recurringTransactionIdParamSchema,
} from "../schemas/recurringTransaction.schema.js";

const router = express.Router();

router.post(
    "/",
    requireAuth,
    validate(createRecurringTransactionSchema),
    createRecurringTransaction,
);
router.get("/", requireAuth, getRecurringTransactions);
router.patch(
    "/:id",
    requireAuth,
    validateParams(recurringTransactionIdParamSchema),
    validate(updateRecurringTransactionSchema),
    updateRecurringTransaction,
);
router.delete(
    "/:id",
    requireAuth,
    validateParams(recurringTransactionIdParamSchema),
    deleteRecurringTransaction,
);
router.post("/run-due-check", requireAuth, runDueCheck);

export default router;
