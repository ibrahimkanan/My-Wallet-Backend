import { z } from "zod";

export const createWalletSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(["cash", "bank", "card"]),
});

export const updateWalletSchema = z
    .object({
        name: z.string().min(1).max(100).optional(),
        type: z.enum(["cash", "bank", "card"]).optional(),
    })
    .refine((data) => data.name !== undefined || data.type !== undefined, {
        message: "At least one field (name or type) must be provided",
    });
