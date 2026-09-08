'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { transferInputSchema } from './model';

export type TransferState = {
  error?: string;
  success?: string;
  uncertain?: boolean;
};

export async function createTransfer(
  _previous: TransferState,
  form: FormData,
): Promise<TransferState> {
  await requireUser();
  const parsed = transferInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Revisa las cuentas, el importe y la fecha.' };
  try {
    const response = await apiRequest('/transfers', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 400)
      return {
        error: 'Las cuentas deben ser diferentes y usar la misma moneda.',
      };
    if (response.status === 404)
      return { error: 'Una de las cuentas ya no está disponible.' };
    if (response.status === 409)
      return { error: 'Esta solicitud ya fue utilizada con otros datos.' };
    if (response.status === 429)
      return { error: 'Espera un momento antes de reintentar.' };
    if (!response.ok)
      return { error: 'No pudimos completar la transferencia.' };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'No pudimos confirmar el envío. Revisa tus cuentas antes de reintentar.',
      uncertain: true,
    };
  }
  revalidatePath('/transferencias');
  revalidatePath('/cuentas');
  revalidatePath('/resumen');
  revalidatePath(`/cuentas/${parsed.data.fromAccountId}`);
  revalidatePath(`/cuentas/${parsed.data.toAccountId}`);
  return { success: 'Transferencia completada.' };
}
