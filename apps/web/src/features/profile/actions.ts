'use server';

import { redirect } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { createSupabaseClient } from '@/lib/supabase/server';

export type DeleteAccountState = { error?: string };

export async function deleteAccount(
  _state: DeleteAccountState,
  form: FormData,
): Promise<DeleteAccountState> {
  if (form.get('confirmation') !== 'ELIMINAR') {
    return { error: 'Escribe ELIMINAR para confirmar.' };
  }
  try {
    const response = await apiRequest('/profile', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'ELIMINAR' }),
    });
    if (!response.ok) {
      return {
        error:
          'No pudimos completar la eliminación. Tus datos no se volverán a crear; inténtalo nuevamente.',
      };
    }
    const client = await createSupabaseClient();
    await client.auth.signOut({ scope: 'local' });
  } catch {
    return { error: 'No pudimos conectar. Inténtalo de nuevo en un momento.' };
  }
  redirect('/cuenta-eliminada');
}
