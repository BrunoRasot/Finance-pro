'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import {
  login,
  register,
  recover,
  updatePassword,
  type FormState,
} from './actions';

export type AuthMode = 'login' | 'register' | 'recover' | 'update';
const actions = { login, register, recover, update: updatePassword };
const titles = {
  login: 'Iniciar sesión',
  register: 'Crear mi cuenta',
  recover: 'Enviar enlace',
  update: 'Guardar contraseña',
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    actions[mode],
    {},
  );
  const [show, setShow] = useState(false);
  const password = mode !== 'recover';
  const confirm = mode === 'register' || mode === 'update';
  return (
    <form action={action} className="auth-form">
      {mode !== 'update' && (
        <label>
          Correo electrónico
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            maxLength={254}
          />
        </label>
      )}
      {password && (
        <label>
          <span className="label-row">
            {mode === 'update' ? 'Nueva contraseña' : 'Contraseña'}
            {mode === 'login' && (
              <Link href="/recuperar-contrasena">¿La olvidaste?</Link>
            )}
          </span>
          <span className="password-input">
            <input
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              placeholder={confirm ? 'Al menos 12 caracteres' : 'Tu contraseña'}
              required
              minLength={confirm ? 12 : 1}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
      )}
      {confirm && (
        <>
          <p className="password-requirements">
            Usa entre 12 y 128 caracteres e incluye una mayúscula, una
            minúscula, un número y un símbolo.
          </p>
          <label>
            Confirmar contraseña
            <input
              name="confirmPassword"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              placeholder="Vuelve a escribirla"
            />
          </label>
        </>
      )}
      {mode === 'register' && (
        <label className="terms-acceptance">
          <input name="termsAccepted" type="checkbox" required />
          <span>
            Acepto los <Link href="/terminos">Términos de uso</Link> y la{' '}
            <Link href="/privacidad">Política de privacidad</Link>.
          </span>
        </label>
      )}
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice success" role="status">
          {state.success}
        </p>
      )}
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle size={18} className="spin" /> Procesando…
          </>
        ) : (
          <>
            {titles[mode]}
            <ArrowRight size={18} />
          </>
        )}
      </button>
      {mode === 'login' ? (
        <p className="form-footer">
          ¿Es tu primera vez? <Link href="/registro">Crea una cuenta</Link>
        </p>
      ) : (
        <p className="form-footer">
          <Link href="/iniciar-sesion">Volver a iniciar sesión</Link>
        </p>
      )}
    </form>
  );
}
