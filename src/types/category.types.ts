export type TransactionType = "income" | "expense";

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: TransactionType;
    icon: string | null;
    created_at: Date;
    updated_at: Date;
}
