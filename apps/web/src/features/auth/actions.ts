'use server';

import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/server';
import { getConfig } from '@/lib/config';
import {
  credentialsSchema,
  emailSchema,
  passwordSchema,
} from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export type FormState = { error?: string; success?: string };
const unavailable = {
  error: 'No pudimos conectar. Inténtalo de nuevo en un momento.',
};

function recoveryError(error: { code?: string; status?: number }): FormState {
  if (error.code === 'email_address_not_authorized')
    return {
      error:
        'Por el momento no podemos enviar el enlace a este correo. Inténtalo más tarde.',
    };
  if (error.code === 'over_email_send_rate_limit' || error.status === 429)
    return {
      error:
        'Se alcanzó el límite temporal de correos. Espera una hora antes de intentarlo nuevamente.',
    };
  return { error: 'No pudimos enviar el enlace. Inténtalo más tarde.' };
}

export async function login(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = emailSchema.safeParse(form.get('email'));
  const password = form.get('password');
  if (
    !email.success ||
    typeof password !== 'string' ||
    !password ||
    password.length > 128
  )
    return { error: 'Revisa tu correo y contraseña.' };
  try {
    const client = await createSupabaseClient();
    const { error } = await client.auth.signInWithPassword({
      email: email.data,
      password,
    });
    if (error)
      return {
        error:
          'No pudimos iniciar sesión. Revisa tus datos y confirma tu correo.',
      };
  } catch {
    return unavailable;
  }
  redirect('/cuentas');
}

export async function register(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });
  if (!parsed.success)
    return {
      error:
        'Usa un correo válido y una contraseña que cumpla todos los requisitos.',
    };
  if (form.get('termsAccepted') !== 'on')
    return {
      error: 'Debes aceptar los Términos y la Política de privacidad.',
    };
  if (form.get('password') !== form.get('confirmPassword'))
    return { error: 'Las contraseñas no coinciden.' };
  let signedIn = false;
  try {
    const client = await createSupabaseClient();
    const { data, error } = await client.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: `${getConfig().APP_ORIGIN}/auth/callback`,
        data: {
          terms_accepted_at: new Date().toISOString(),
          terms_version: '2026-09-08',
        },
      },
    });
    if (error)
      return {
        error:
          'No se pudo completar el registro. Inténtalo más tarde o inicia sesión si ya tienes una cuenta.',
      };
    signedIn = !!data.session;
  } catch {
    return unavailable;
  }
  if (signedIn) redirect('/cuentas');
  return {
    success:
      'Revisa tu correo para confirmar tu cuenta. Abre el enlace en este mismo navegador.',
  };
}

export async function recover(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = emailSchema.safeParse(form.get('email'));
  if (!email.success) return { error: 'Escribe un correo electrónico válido.' };
  try {
    const client = await createSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${getConfig().APP_ORIGIN}/auth/callback?next=/actualizar-contrasena`,
    });
    if (error) return recoveryError(error);
  } catch {
    return unavailable;
  }
  return {
    success:
      'Si el correo tiene una cuenta, recibirás un enlace para restablecer tu contraseña. Ábrelo en este navegador.',
  };
}

export async function updatePassword(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { client } = await requireUser();
  const password = passwordSchema.safeParse(form.get('password'));
  if (!password.success)
    return { error: 'La contraseña no cumple todos los requisitos.' };
  if (form.get('password') !== form.get('confirmPassword'))
    return { error: 'Las contraseñas no coinciden.' };
  try {
    const { error } = await client.auth.updateUser({ password: password.data });
    if (error)
      return {
        error:
          'No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo de nuevo.',
      };
  } catch {
    return unavailable;
  }
  redirect('/cuentas');
}

export async function logout(): Promise<FormState> {
  try {
    const client = await createSupabaseClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) return unavailable;
  } catch {
    return unavailable;
  }
  redirect('/iniciar-sesion');
}
