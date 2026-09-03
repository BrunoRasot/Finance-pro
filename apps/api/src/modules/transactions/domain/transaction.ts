export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;
export const CATEGORY_TYPES = {
  SALARY: 'INCOME',
  FREELANCE: 'INCOME',
  FOOD: 'EXPENSE',
  TRANSPORT: 'EXPENSE',
  HOUSING: 'EXPENSE',
  HEALTH: 'EXPENSE',
  EDUCATION: 'EXPENSE',
  ENTERTAINMENT: 'EXPENSE',
  OTHER: 'BOTH',
} as const;
export const CATEGORIES = Object.keys(CATEGORY_TYPES);
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type Category = keyof typeof CATEGORY_TYPES;
export interface NewTransaction {
  type: TransactionType;
  category: Category;
  amount: string;
  date: string;
  description: string;
  idempotencyKey: string;
}
export interface Transaction extends NewTransaction {
  id: string;
  accountId: string;
  createdAt: string;
}
export interface TransactionQuery {
  limit: number;
  offset: number;
  type?: TransactionType;
  category?: Category;
  from?: string;
  to?: string;
}
export interface AccountBalance {
  accountId: string;
  currency: 'PEN' | 'USD';
  openingBalance: string;
  totalIncome: string;
  totalExpense: string;
  balance: string;
}
