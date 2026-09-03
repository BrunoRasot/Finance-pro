import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { getConfig } from '@/lib/config';
import { safeDestination } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    try {
      const client = await createSupabaseClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(
          new URL(
            safeDestination(request.nextUrl.searchParams.get('next')),
            getConfig().APP_ORIGIN,
          ),
        );
    } catch {
      /* Return a safe retry page without including tokens or errors. */
    }
  }
  return NextResponse.redirect(
    new URL('/iniciar-sesion?error=enlace', getConfig().APP_ORIGIN),
  );
}
