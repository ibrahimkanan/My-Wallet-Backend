import express from "express";
import { getMonthlyChart, getYearlyChart } from "../controllers/chart.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateQuery } from "../middleware/validate.js";
import { monthlyChartQuerySchema, yearlyChartQuerySchema } from "../schemas/chart.schema.js";

const router = express.Router();

router.get("/monthly", requireAuth, validateQuery(monthlyChartQuerySchema), getMonthlyChart);
router.get("/yearly", requireAuth, validateQuery(yearlyChartQuerySchema), getYearlyChart);

export default router;