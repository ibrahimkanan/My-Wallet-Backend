import { z } from "zod";

export const monthlyChartQuerySchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2020).max(2100),
});

export const yearlyChartQuerySchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100),
});
