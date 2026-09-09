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
  const currentPassword = form.get('currentPassword');
  if (
    typeof currentPassword !== 'string' ||
    !currentPassword ||
    currentPassword.length > 128
  )
    return { error: 'Confirma tu contraseña actual.' };
  try {
    const client = await createSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user?.email)
      return { error: 'Vuelve a iniciar sesión antes de eliminar tu cuenta.' };
    const { error: reauthenticationError } =
      await client.auth.signInWithPassword({
        email: data.user.email,
        password: currentPassword,
      });
    if (reauthenticationError)
      return { error: 'La contraseña actual no es correcta.' };
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
    await client.auth.signOut({ scope: 'local' });
  } catch {
    return { error: 'No pudimos conectar. Inténtalo de nuevo en un momento.' };
  }
  redirect('/cuenta-eliminada');
}
