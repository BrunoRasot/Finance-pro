import 'server-only';
import { z } from 'zod';
import { budgetCategorySchema } from '@/features/budgets/model';
import { apiRequest } from './api';

const budgetSchema = z.object({
  id: z.uuid(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.enum(['PEN', 'USD']),
  category: budgetCategorySchema,
  amount: z.string().regex(/^\d+\.\d{2}$/),
  spent: z.string().regex(/^\d+\.\d{2}$/),
  remaining: z.string().regex(/^-?\d+\.\d{2}$/),
  usagePercent: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Budget = z.infer<typeof budgetSchema>;

export async function listBudgets(month: string) {
  const response = await apiRequest(`/budgets?month=${month}`);
  if (!response.ok) throw new Error('Budgets unavailable');
  return z
    .object({ month: z.string(), items: z.array(budgetSchema) })
    .parse(await response.json());
}
