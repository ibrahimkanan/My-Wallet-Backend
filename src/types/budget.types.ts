export interface Budget {
    id: string;
    user_id: string;
    category_id: string | null;
    amount: string;
    month: number;
    year: number;
    created_at: Date;
}