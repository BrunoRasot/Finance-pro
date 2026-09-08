export const BUDGET_CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'OTHER',
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export type BudgetCurrency = 'PEN' | 'USD';

export interface Budget {
  id: string;
  month: string;
  currency: BudgetCurrency;
  category: BudgetCategory;
  amount: string;
  spent: string;
  remaining: string;
  usagePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  month: string;
  currency: BudgetCurrency;
  category: BudgetCategory;
  amount: string;
}
