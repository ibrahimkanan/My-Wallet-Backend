export type TransactionType = "income" | "expense";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringTransaction {
    id: string;
    user_id: string;
    wallet_id: string;
    category_id: string | null;
    type: TransactionType;
    amount: string;
    note: string | null;
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date: string | null;
    next_due_date: string;
    is_active: boolean;
    created_at: Date;
}