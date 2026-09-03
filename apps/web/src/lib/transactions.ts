import 'server-only';
import { z } from 'zod';
import { notFound } from 'next/navigation';
import { accountsRequest } from './accounts';
import {
  categorySchema,
  dateSchema,
  type Filters,
} from '@/features/transactions/model';
export const balanceSchema = z.object({
  accountId: z.uuid(),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z.string().regex(/^\d+\.\d{2}$/),
  totalIncome: z.string().regex(/^\d+\.\d{2}$/),
  totalExpense: z.string().regex(/^\d+\.\d{2}$/),
  balance: z.string().regex(/^-?\d+\.\d{2}$/),
});
export type Balance = z.infer<typeof balanceSchema>;
const movementSchema = z.object({
  id: z.uuid(),
  accountId: z.uuid(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: categorySchema,
  amount: z.string().regex(/^\d+\.\d{2}$/),
  date: dateSchema,
  description: z.string(),
  createdAt: z.string(),
});
export type Movement = z.infer<typeof movementSchema>;
export async function getBalance(accountId: string) {
  const response = await accountsRequest(`/${accountId}/balance`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Balance unavailable');
  return balanceSchema.parse(await response.json());
}
export async function getMovements(accountId: string, filters: Filters) {
  const query = new URLSearchParams({
    limit: '20',
    offset: String((filters.page - 1) * 20),
  });
  for (const key of ['type', 'category', 'from', 'to'] as const)
    if (filters[key]) query.set(key, filters[key]);
  const response = await accountsRequest(`/${accountId}/transactions?${query}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('History unavailable');
  return z
    .object({
      items: z.array(movementSchema),
      limit: z.number(),
      offset: z.number(),
    })
    .parse(await response.json());
}
