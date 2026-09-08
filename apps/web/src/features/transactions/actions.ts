'use server';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { accountsRequest } from '@/lib/accounts';
import { requireUser } from '@/lib/auth';
import { transactionChangesSchema, transactionInputSchema } from './model';
export type MovementState = {
  error?: string;
  success?: string;
  uncertain?: boolean;
};
export async function createMovement(
  accountId: string,
  form: FormData,
): Promise<MovementState> {
  await requireUser();
  if (!z.uuid().safeParse(accountId).success)
    return { error: 'La cuenta no es válida.' };
  const parsed = transactionInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Revisa el importe, la fecha y la categoría. Usa un importe mayor que cero y hasta dos decimales.',
    };
  try {
    const response = await accountsRequest(`/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) {
      if (response.status === 409)
        return {
          error:
            'Este envío ya existe con otros datos. Revisa el historial antes de comenzar otro movimiento.',
          uncertain: true,
        };
      if (response.status === 404)
        return { error: 'La cuenta no está disponible.' };
      if (response.status === 400)
        return { error: 'Los datos no son válidos. Revisa el movimiento.' };
      if (response.status === 429)
        return { error: 'Espera un momento antes de reintentar.' };
      return {
        error:
          'No pudimos confirmar el resultado. Reintenta el mismo envío para evitar duplicados.',
        uncertain: true,
      };
    }
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'La conexión se interrumpió. Reintenta el mismo envío; no se registrará dos veces.',
      uncertain: true,
    };
  }
  revalidatePath(`/cuentas/${accountId}`);
  revalidatePath('/cuentas');
  revalidatePath('/resumen');
  return { success: 'Movimiento registrado. El saldo se ha actualizado.' };
}

function validIds(accountId: string, movementId: string) {
  return (
    z.uuid().safeParse(accountId).success &&
    z.uuid().safeParse(movementId).success
  );
}
function refreshFinance(accountId: string) {
  revalidatePath(`/cuentas/${accountId}`);
  revalidatePath('/cuentas');
  revalidatePath('/resumen');
}
export async function updateMovement(
  accountId: string,
  movementId: string,
  form: FormData,
): Promise<MovementState> {
  await requireUser();
  if (!validIds(accountId, movementId))
    return { error: 'El movimiento no es válido.' };
  const parsed = transactionChangesSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: 'Revisa el importe, la fecha y la categoría del movimiento.',
    };
  try {
    const response = await accountsRequest(
      `/${accountId}/transactions/${movementId}`,
      { method: 'PATCH', body: JSON.stringify(parsed.data) },
    );
    if (response.status === 404)
      return { error: 'El movimiento no está disponible.' };
    if (response.status === 400)
      return { error: 'Los datos del movimiento no son válidos.' };
    if (response.status === 429)
      return { error: 'Espera un momento antes de reintentar.' };
    if (!response.ok) return { error: 'No pudimos actualizar el movimiento.' };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: 'La conexión se interrumpió. El movimiento no se actualizó.',
    };
  }
  refreshFinance(accountId);
  return { success: 'Movimiento actualizado.' };
}
export async function deleteMovement(
  accountId: string,
  movementId: string,
  form: FormData,
): Promise<MovementState> {
  await requireUser();
  if (!validIds(accountId, movementId))
    return { error: 'El movimiento no es válido.' };
  if (form.get('confirmation') !== 'DELETE')
    return { error: 'Confirma la eliminación del movimiento.' };
  try {
    const response = await accountsRequest(
      `/${accountId}/transactions/${movementId}`,
      { method: 'DELETE' },
    );
    if (response.status === 404)
      return { error: 'El movimiento ya no está disponible.' };
    if (response.status === 429)
      return { error: 'Espera un momento antes de reintentar.' };
    if (!response.ok) return { error: 'No pudimos eliminar el movimiento.' };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'La conexión se interrumpió. Comprueba el historial antes de reintentar.',
    };
  }
  refreshFinance(accountId);
  return { success: 'Movimiento eliminado.' };
}
