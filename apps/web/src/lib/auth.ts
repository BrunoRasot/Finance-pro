import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from './supabase/server';

export async function requireUser() {
  const client = await createSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.is_anonymous)
    redirect('/iniciar-sesion');
  return { client, user: data.user };
}
