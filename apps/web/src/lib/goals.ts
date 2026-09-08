import 'server-only';
import { z } from 'zod';
import { apiRequest } from './api';

const goalSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  currency: z.enum(['PEN', 'USD']),
  targetAmount: z.string().regex(/^\d+\.\d{2}$/),
  savedAmount: z.string().regex(/^\d+\.\d{2}$/),
  remainingAmount: z.string().regex(/^\d+\.\d{2}$/),
  progressPercent: z.number().nonnegative(),
  deadline: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type SavingsGoal = z.infer<typeof goalSchema>;

export async function listGoals(status: 'ACTIVE' | 'ARCHIVED') {
  const response = await apiRequest(`/goals?status=${status}`);
  if (!response.ok) throw new Error('Goals unavailable');
  return z.object({ items: z.array(goalSchema) }).parse(await response.json());
}
