import { z } from "zod";

export const createBudgetSchema = z.object({
    category_id: z.string().uuid("Invalid category id").optional(),
    amount: z.number().positive("Amount must be positive"),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
});

export const updateBudgetSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
});

export const budgetIdParamSchema = z.object({
    id: z.string().uuid("Invalid budget id"),
});