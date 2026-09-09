export interface CategoryBreakdown {
    category_id: string | null;
    category_name: string | null;
    total: number;
}

export interface MonthlyPoint {
    month: number;
    total_income: number;
    total_expense: number;
    net: number;
}
