'use server';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { accountsRequest } from '@/lib/accounts';
import { requireUser } from '@/lib/auth';
import { accountChangesSchema, newAccountSchema } from '@/lib/validation';
import type { FormState } from '@/features/auth/actions';
export async function createAccount(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = newAccountSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Revisa los datos. El saldo debe ser positivo o cero, con hasta dos decimales.',
    };
  try {
    const response = await accountsRequest('', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok)
      return {
        error:
          response.status === 429
            ? 'Demasiadas solicitudes. Espera un momento.'
            : 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.',
      };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'No pudimos guardar la cuenta. Revisa tu conexión e inténtalo nuevamente.',
    };
  }
  revalidatePath('/cuentas');
  return { success: 'Cuenta creada correctamente.' };
}

function refreshAccounts(id: string) {
  revalidatePath('/cuentas');
  revalidatePath(`/cuentas/${id}`);
  revalidatePath('/resumen');
}

export async function updateAccount(
  id: string,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  if (!z.uuid().safeParse(id).success)
    return { error: 'La cuenta no es válida.' };
  const parsed = accountChangesSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: 'Revisa el nombre, tipo y saldo inicial de la cuenta.',
    };
  try {
    const response = await accountsRequest(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 404)
      return { error: 'La cuenta ya no está disponible.' };
    if (!response.ok) return { error: 'No pudimos actualizar la cuenta.' };
  } catch (error) {
    unstable_rethrow(error);
    return { error: 'La conexión se interrumpió. La cuenta no cambió.' };
  }
  refreshAccounts(id);
  return { success: 'Cuenta actualizada.' };
}

export async function archiveAccount(
  id: string,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  if (!z.uuid().safeParse(id).success)
    return { error: 'La cuenta no es válida.' };
  if (form.get('confirmation') !== 'ARCHIVE')
    return { error: 'Confirma que deseas archivar la cuenta.' };
  try {
    const response = await accountsRequest(`/${id}/archive`, {
      method: 'POST',
    });
    if (response.status === 404)
      return { error: 'La cuenta ya no está disponible.' };
    if (!response.ok) return { error: 'No pudimos archivar la cuenta.' };
  } catch (error) {
    unstable_rethrow(error);
    return { error: 'La conexión se interrumpió. Revisa tus cuentas.' };
  }
  refreshAccounts(id);
  return { success: 'Cuenta archivada.' };
}

export async function restoreAccount(id: string): Promise<FormState> {
  await requireUser();
  if (!z.uuid().safeParse(id).success)
    return { error: 'La cuenta no es válida.' };
  try {
    const response = await accountsRequest(`/${id}/restore`, {
      method: 'POST',
    });
    if (response.status === 404)
      return { error: 'La cuenta ya no está disponible.' };
    if (!response.ok) return { error: 'No pudimos restaurar la cuenta.' };
  } catch (error) {
    unstable_rethrow(error);
    return { error: 'La conexión se interrumpió. Revisa tus cuentas.' };
  }
  refreshAccounts(id);
  return { success: 'Cuenta restaurada.' };
}
