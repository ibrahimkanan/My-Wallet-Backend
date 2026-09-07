import { z } from "zod";

export const createTransactionSchema = z.object({
    wallet_id: z.string().uuid("Invalid wallet id"),
    category_id: z.string().uuid("Invalid category id").optional(),
    type: z.enum(["income", "expense"]),
    amount: z.number().positive("Amount must be positive"),
    note: z.string().max(500).optional(),
    transaction_date: z.string().date("Expected format: YYYY-MM-DD"),
});

export const updateTransactionSchema = z
    .object({
        wallet_id: z.string().uuid().optional(),
        category_id: z.string().uuid().nullable().optional(),
        type: z.enum(["income", "expense"]).optional(),
        amount: z.number().positive().optional(),
        note: z.string().max(500).nullable().optional(),
        transaction_date: z.string().date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    });

export const transactionIdParamSchema = z.object({
    id: z.string().uuid("Invalid transaction id"),
});
