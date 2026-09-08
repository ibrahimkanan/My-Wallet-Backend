import express from "express";
import {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    getBudgetSummary,
} from "../controllers/budget.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate, validateParams } from "../middleware/validate.js";
import {
    createBudgetSchema,
    updateBudgetSchema,
    budgetIdParamSchema,
} from "../schemas/budget.schema.js";

const router = express.Router();

router.post("/", requireAuth, validate(createBudgetSchema), createBudget);
router.get("/", requireAuth, getBudgets);
router.get("/summary", requireAuth, getBudgetSummary);
router.patch(
    "/:id",
    requireAuth,
    validateParams(budgetIdParamSchema),
    validate(updateBudgetSchema),
    updateBudget,
);
router.delete("/:id", requireAuth, validateParams(budgetIdParamSchema), deleteBudget);

export default router;