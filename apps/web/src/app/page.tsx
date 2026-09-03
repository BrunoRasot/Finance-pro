import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/server';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  const client = await createSupabaseClient();
  const { data } = await client.auth.getUser();
  redirect(data.user ? '/cuentas' : '/iniciar-sesion');
}
