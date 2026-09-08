import { api } from './api';
import type {
  Account,
  Balance,
  Budget,
  Goal,
  MonthlyReport,
  Movement,
} from './types';

export const listAccounts = () =>
  api<{ items: Account[] }>('/accounts?limit=100&offset=0&status=ACTIVE');
export const getBalance = (id: string) =>
  api<Balance>(`/accounts/${id}/balance`);
export const getMovements = (id: string) =>
  api<{ items: Movement[] }>(`/accounts/${id}/transactions?limit=50&offset=0`);
export const monthlyReport = (month: string) =>
  api<MonthlyReport>(`/reports/monthly?month=${month}`);
export const listGoals = () => api<{ items: Goal[] }>('/goals?status=ACTIVE');
export const listBudgets = (month: string) =>
  api<{ month: string; items: Budget[] }>(`/budgets?month=${month}`);
export { amount } from './money';
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function currentMonth() {
  return today().slice(0, 7);
}
