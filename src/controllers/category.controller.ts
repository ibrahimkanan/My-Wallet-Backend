import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
    createCategory as createCategoryRepo,
    getCategoriesByUser,
    getCategoryById,
    updateCategory as updateCategoryRepo,
    deleteCategory as deleteCategoryRepo,
} from "../repositories/category.repo.js";

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { name, type, icon } = req.body as {
            name: string;
            type: "income" | "expense";
            icon?: string | null;
        };

        const category = await createCategoryRepo(userId, name, type, icon);

        return res.status(200).json({
            status: "ok",
            category,
        });
    } catch (error: any) {
        console.error("Error creating category:", error);
        if (error?.code === "23505") {
            return res.status(400).json({
                error: "CATEGORY_ALREADY_EXISTS",
                message: "Category with this name already exists",
            });
        }
        res.status(500).json({ error: "Failed to create category" });
    }
};

export const getUserCategories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const categories = await getCategoriesByUser(userId);
        return res.status(200).json({
            status: "ok",
            categories,
        });
    } catch (error) {
        console.error("Error getting categories:", error);
        res.status(500).json({ error: "Failed to get categories" });
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid category ID" });
        }

        const existing = await getCategoryById(id, userId);
        if (!existing) {
            return res.status(404).json({ error: "Category not found" });
        }

        const category = await updateCategoryRepo(id, userId, req.body);
        return res.status(200).json({
            status: "ok",
            category,
        });
    } catch (error: any) {
        console.error("Error updating category:", error);
        if (error?.code === "23505") {
            return res.status(400).json({
                error: "CATEGORY_ALREADY_EXISTS",
                message: "Category with this name already exists",
            });
        }
        res.status(500).json({ error: "Failed to update category" });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid category ID" });
        }

        const existing = await getCategoryById(id, userId);
        if (!existing) {
            return res.status(404).json({ error: "Category not found" });
        }

        const category = await deleteCategoryRepo(id, userId);
        return res.status(200).json({
            status: "ok",
            category,
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
};
