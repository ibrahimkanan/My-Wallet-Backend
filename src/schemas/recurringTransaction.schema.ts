import { z } from "zod";

export const createRecurringTransactionSchema = z.object({
    wallet_id: z.string().uuid("Invalid wallet id"),
    category_id: z.string().uuid("Invalid category id").optional(),
    type: z.enum(["income", "expense"]),
    amount: z.number().positive("Amount must be positive"),
    note: z.string().max(500).optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    start_date: z.string().date("Expected format: YYYY-MM-DD"),
    end_date: z.string().date("Expected format: YYYY-MM-DD").optional(),
});

export const updateRecurringTransactionSchema = z
    .object({
        wallet_id: z.string().uuid().optional(),
        category_id: z.string().uuid().nullable().optional(),
        amount: z.number().positive().optional(),
        note: z.string().max(500).nullable().optional(),
        end_date: z.string().date().nullable().optional(),
        is_active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    });

export const recurringTransactionIdParamSchema = z.object({
    id: z.string().uuid("Invalid recurring transaction id"),
});
