import 'server-only';
import { redirect } from 'next/navigation';
import { requireUser } from './auth';
import { getConfig } from './config';
export async function apiRequest(path: string, init?: RequestInit) {
  const { client } = await requireUser();
  const { data } = await client.auth.getSession();
  if (!data.session) redirect('/iniciar-sesion');
  const response = await fetch(`${getConfig().API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    cache: 'no-store',
    // Render's free instances can take close to a minute to wake after idle.
    signal: AbortSignal.timeout(60_000),
  });
  if (response.status === 401) redirect('/iniciar-sesion');
  return response;
}
