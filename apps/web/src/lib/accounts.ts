import 'server-only';
import { z } from 'zod';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from './auth';
import { getConfig } from './config';

const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['CASH', 'BANK', 'WALLET']),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z.string().regex(/^\d+\.\d{2}$/),
  createdAt: z.string(),
});
export type Account = z.infer<typeof accountSchema>;
export async function findAccount(id: string) {
  const response = await accountsRequest(`/${id}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Account unavailable');
  return accountSchema.parse(await response.json());
}
export async function accountsRequest(path: string, init?: RequestInit) {
  const { client } = await requireUser();
  const { data } = await client.auth.getSession();
  if (!data.session) redirect('/iniciar-sesion');
  const response = await fetch(`${getConfig().API_BASE_URL}/accounts${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401) redirect('/iniciar-sesion');
  return response;
}
export async function listAccounts(offset: number) {
  const response = await accountsRequest(`?limit=12&offset=${offset}`);
  if (!response.ok) throw new Error('Accounts unavailable');
  return z
    .object({
      items: z.array(accountSchema),
      limit: z.number(),
      offset: z.number(),
    })
    .parse(await response.json());
}
