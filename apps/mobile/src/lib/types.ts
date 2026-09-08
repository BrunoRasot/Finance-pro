export type Currency = 'PEN' | 'USD';
export type Account = {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'WALLET';
  currency: Currency;
  openingBalance: string;
  archivedAt: string | null;
};
export type Balance = {
  balance: string;
  totalIncome: string;
  totalExpense: string;
  currency: Currency;
};
export type Movement = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: string;
  date: string;
  description: string;
  transferId: string | null;
};
export type MonthlyReport = {
  month: string;
  currencies: {
    currency: Currency;
    income: string;
    expense: string;
    net: string;
    categories: {
      type: string;
      category: string;
      total: string;
      count: string;
    }[];
  }[];
};
export type Goal = {
  id: string;
  name: string;
  currency: Currency;
  targetAmount: string;
  savedAmount: string;
  remainingAmount: string;
  progressPercent: number;
  deadline: string | null;
  archivedAt?: string | null;
};
export type Budget = {
  id: string;
  month: string;
  currency: Currency;
  category: string;
  amount: string;
  spent: string;
  remaining: string;
  usagePercent: number;
};
