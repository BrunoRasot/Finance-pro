import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getConfig } from './lib/config';

export async function proxy(request: NextRequest) {
  const config = getConfig();
  let response = NextResponse.next({ request });
  const client = createServerClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const { data } = await client.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;
  const protectedPrefixes = [
    '/resumen',
    '/cuentas',
    '/transferencias',
    '/presupuestos',
    '/metas',
    '/exportar',
    '/configuracion',
    '/actualizar-contrasena',
  ];
  if (
    !signedIn &&
    protectedPrefixes.some((prefix) => path.startsWith(prefix))
  ) {
    const login = request.nextUrl.clone();
    login.pathname = '/iniciar-sesion';
    login.search = '';
    return NextResponse.redirect(login);
  }
  if (
    signedIn &&
    ['/iniciar-sesion', '/registro', '/recuperar-contrasena'].includes(path)
  ) {
    const accounts = request.nextUrl.clone();
    accounts.pathname = '/cuentas';
    accounts.search = '';
    return NextResponse.redirect(accounts);
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
