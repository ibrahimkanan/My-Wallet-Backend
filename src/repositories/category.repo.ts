// category.repo.ts
import pool from "../config/db.js";
import type { Category, TransactionType } from "../types/category.types.js";

// Create a category
export const createCategory = async (
    userId: string,
    name: string,
    type: TransactionType,
    icon?: string | null,
): Promise<Category> => {
    const result = await pool.query(
        `
        INSERT INTO categories (user_id, name, type, icon)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `,
        [userId, name, type, icon],
    );
    return result.rows[0];
};

// Get all categories
export const getCategoriesByUser = async (
    userId: string,
): Promise<Category[]> => {
    const result = await pool.query<Category>(
        `SELECT * FROM categories 
        WHERE user_id = $1 
        ORDER BY name ASC`,
        [userId],
    );
    return result.rows;
};

// Get a category by ID
export const getCategoryById = async (
    categoryId: string,
    userId: string,
): Promise<Category | null> => {
    const result = await pool.query<Category>(
        `SELECT * FROM categories WHERE id = $1 AND user_id = $2`,
        [categoryId, userId],
    );
    return result.rows[0] ?? null;
};

// Update a category dynamically
export const updateCategory = async (
    categoryId: string,
    userId: string,
    updates: {
        name?: string;
        type?: TransactionType;
        icon?: string | null;
    },
): Promise<Category | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
        fields.push("name");
        values.push(updates.name);
    }
    if (updates.type !== undefined) {
        fields.push("type");
        values.push(updates.type);
    }
    if (updates.icon !== undefined) {
        fields.push("icon");
        values.push(updates.icon);
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(categoryId, userId);

    const result = await pool.query<Category>(
        `
        UPDATE categories
        SET ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")}
        WHERE id = $${values.length - 1} AND user_id = $${values.length}
        RETURNING *;
        `,
        values,
    );

    return result.rows[0] ?? null;
};

// Delete a category
export const deleteCategory = async (
    categoryId: string,
    userId: string,
): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM categories WHERE id = $1 AND user_id = $2`,
        [categoryId, userId],
    );
    return (result.rowCount ?? 0) > 0;
};
