import express from "express";
import {
    createCategory,
    getUserCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate, validateParams } from "../middleware/validate.js";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
} from "../schemas/categories.schema.js";

const router = express.Router();

router.post("/", requireAuth, validate(createCategorySchema), createCategory);
router.get("/", requireAuth, getUserCategories);
router.patch(
    "/:id",
    requireAuth,
    validateParams(categoryIdParamSchema),
    validate(updateCategorySchema),
    updateCategory,
);
router.delete(
    "/:id",
    requireAuth,
    validateParams(categoryIdParamSchema),
    deleteCategory,
);

export default router;
