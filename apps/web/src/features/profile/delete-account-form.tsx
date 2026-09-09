'use client';

import { useActionState, useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { deleteAccount, type DeleteAccountState } from './actions';

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(
    deleteAccount,
    {},
  );

  if (!open) {
    return (
      <button className="button destructive" onClick={() => setOpen(true)}>
        <Trash2 size={17} /> Eliminar mi cuenta
      </button>
    );
  }

  return (
    <form action={action} className="delete-account-form">
      <p>
        Esta acción elimina permanentemente tus cuentas, movimientos,
        transferencias, presupuestos, metas y acceso a Finance Pro.
      </p>
      <label>
        Escribe <strong>ELIMINAR</strong> para confirmar
        <input
          name="confirmation"
          required
          autoComplete="off"
          maxLength={8}
          pattern="ELIMINAR"
        />
      </label>
      <label>
        Confirma tu contraseña actual
        <input
          name="currentPassword"
          type="password"
          required
          minLength={1}
          maxLength={128}
          autoComplete="current-password"
        />
      </label>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button
          type="button"
          className="button subtle"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </button>
        <button className="button destructive" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={17} /> : null}
          {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </div>
    </form>
  );
}
