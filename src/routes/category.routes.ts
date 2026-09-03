import express from "express";
import {
    createCategory,
    getUserCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
    createCategorySchema,
    updateCategorySchema,
} from "../schemas/categories.schema.js";

const router = express.Router();

// All category routes require authentication
router.post("/", requireAuth, validate(createCategorySchema), createCategory);
router.get("/", requireAuth, getUserCategories);
router.patch(
    "/:id",
    requireAuth,
    validate(updateCategorySchema),
    updateCategory,
);
router.delete("/:id", requireAuth, deleteCategory);

export default router;
