import { z } from "zod";

export const updateProfileSchema = z
    .object({
        name: z.string().min(1).max(100).optional(),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .optional(),
        default_monthly_budget: z.number().positive().optional(),
    })
    .refine(
        (data) =>
            data.name !== undefined ||
            data.password !== undefined ||
            data.default_monthly_budget !== undefined,
        { message: "At least one field must be provided" },
    );
