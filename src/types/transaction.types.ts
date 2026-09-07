export type TransactionType = "income" | "expense";

export interface Transaction {
    id: string;
    user_id: string;
    wallet_id: string;
    category_id: string | null;
    recurring_transaction_id: string | null;
    type: TransactionType;
    amount: number;
    note: string | null;
    transaction_date: string;
    created_at: Date;
}
