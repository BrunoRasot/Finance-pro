'use server';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { accountsRequest } from '@/lib/accounts';
import { newAccountSchema } from '@/lib/validation';
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
    return { error: 'No pudimos conectar con el backend. Inténtalo de nuevo.' };
  }
  revalidatePath('/cuentas');
  return { success: 'Cuenta creada correctamente.' };
}
