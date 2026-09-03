// catagory.schema.ts
import { z } from "zod";

// Schema for creating a  category
export const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    type: z.enum(["income", "expense"]),
    icon: z.string().max(50).optional(),
});

// Schema for updating a category
export const updateCategorySchema = z
    .object({
        name: z.string().min(1).max(100).optional(),
        type: z.enum(["income", "expense"]).optional(),
        icon: z.string().max(50).nullable().optional(),
    })
    .refine(
        (data) =>
            data.name !== undefined ||
            data.type !== undefined ||
            data.icon !== undefined,
        {
            message:
                "At least one field (name, type, or icon) must be provided to update",
        },
    );
