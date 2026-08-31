import { z } from "zod";

export const updateProfileSchema = z
    .object({
        name: z.string().min(1).max(100).optional(),
        password: z
            .string()
            .min(8)
            .regex(/[a-z]/, "at least one lowercase letter")
            .regex(/[A-Z]/, "at least one uppercase letter")
            .regex(/\d/, "at least one number")
            .regex(/[^a-zA-Z0-9]/, "at least one special character")
            .optional(),
    })
    .refine((data) => data.name !== undefined || data.password !== undefined, {
        message: "At least one field is required",
        path: ["name", "password"],
    });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
