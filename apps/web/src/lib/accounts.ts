import 'server-only';
import { z } from 'zod';
import { notFound } from 'next/navigation';
import { apiRequest } from './api';

const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['CASH', 'BANK', 'WALLET']),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z.string().regex(/^\d+\.\d{2}$/),
  createdAt: z.string(),
  archivedAt: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;
export async function findAccount(id: string) {
  const response = await accountsRequest(`/${id}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Account unavailable');
  return accountSchema.parse(await response.json());
}
export async function accountsRequest(path: string, init?: RequestInit) {
  return apiRequest(`/accounts${path}`, init);
}
export async function listAccounts(
  offset: number,
  status: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE',
  limit = 12,
) {
  const response = await accountsRequest(
    `?limit=${limit}&offset=${offset}&status=${status}`,
  );
  if (!response.ok) throw new Error('Accounts unavailable');
  return z
    .object({
      items: z.array(accountSchema),
      limit: z.number(),
      offset: z.number(),
    })
    .parse(await response.json());
}
