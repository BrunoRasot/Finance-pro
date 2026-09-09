import 'server-only';
import { redirect } from 'next/navigation';
import { requireUser } from './auth';
import { getConfig } from './config';
export async function apiRequest(path: string, init?: RequestInit) {
  const { client } = await requireUser();
  const { data } = await client.auth.getSession();
  if (!data.session) redirect('/iniciar-sesion');
  const request = () =>
    fetch(`${getConfig().API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
        ...init?.headers,
      },
      cache: 'no-store',
      // A free Render instance can occasionally need more than a minute to wake.
      signal: AbortSignal.timeout(120_000),
    });
  const method = init?.method?.toUpperCase() ?? 'GET';
  const safeToRetry = ['GET', 'HEAD'].includes(method);
  let response: Response;
  try {
    response = await request();
  } catch (error) {
    if (!safeToRetry) throw error;
    // Retrying reads is safe and covers the edge case where the first request
    // wakes the service but the connection closes during the cold start.
    response = await request();
  }
  if (safeToRetry && [502, 503, 504].includes(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    response = await request();
  }
  if (response.status === 401) redirect('/iniciar-sesion');
  return response;
}
