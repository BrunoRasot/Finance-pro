import { supabase } from './supabase';
import { config } from './config';
import { randomUUID } from 'expo-crypto';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiResponse(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
export async function apiResponse(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  if (!data.session)
    throw new ApiError(401, 'Tu sesión terminó. Vuelve a ingresar.');
  const controller = new AbortController();
  // Allow the free Render API enough time to wake after an idle period.
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
        ...init?.headers,
      },
      signal: controller.signal,
    });
    if (response.status === 401) {
      await supabase.auth.signOut();
      throw new ApiError(401, 'Tu sesión terminó. Vuelve a ingresar.');
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new ApiError(
        response.status,
        body?.message ?? 'No se pudo completar la operación.',
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError')
      throw new ApiError(408, 'La conexión tardó demasiado.');
    throw new ApiError(
      0,
      'No pudimos actualizar tus datos. Revisa tu conexión e inténtalo nuevamente.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
export function retryKey() {
  return randomUUID();
}
