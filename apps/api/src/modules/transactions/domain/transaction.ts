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
export const HISTORY_CATEGORIES = [...CATEGORIES, 'TRANSFER'] as const;
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
export type TransactionChanges = Omit<NewTransaction, 'idempotencyKey'>;
export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: Category | 'TRANSFER';
  amount: string;
  date: string;
  description: string;
  idempotencyKey: string;
  createdAt: string;
  transferId: string | null;
}
export type StoredTransaction = Transaction;
export interface TransactionQuery {
  limit: number;
  offset: number;
  type?: TransactionType;
  category?: Category | 'TRANSFER';
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
