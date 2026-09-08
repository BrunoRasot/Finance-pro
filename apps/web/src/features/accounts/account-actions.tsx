'use client';

import { useActionState, useState } from 'react';
import { Archive, Pencil, RotateCcw, X } from 'lucide-react';
import type { Account } from '@/lib/accounts';
import type { FormState } from '@/features/auth/actions';
import { archiveAccount, restoreAccount, updateAccount } from './actions';

const types = [
  ['BANK', 'Banco'],
  ['CASH', 'Efectivo'],
  ['WALLET', 'Billetera digital'],
] as const;

export function AccountActions({ account }: { account: Account }) {
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [editState, editAction, editingPending] = useActionState<
    FormState,
    FormData
  >(async (_previous, form) => {
    const result = await updateAccount(account.id, form);
    if (result.success) setEditing(false);
    return result;
  }, {});
  const [archiveState, archiveAction, archivePending] = useActionState<
    FormState,
    FormData
  >(async (_previous, form) => archiveAccount(account.id, form), {});
  const [restoreState, restoreAction, restorePending] = useActionState<
    FormState,
    FormData
  >(async () => restoreAccount(account.id), {});

  if (account.archivedAt)
    return (
      <form action={restoreAction} className="account-inline-action">
        {restoreState.error && <span role="alert">{restoreState.error}</span>}
        <button className="account-row-link" disabled={restorePending}>
          <RotateCcw size={15} />
          {restorePending ? 'Restaurando…' : 'Restaurar'}
        </button>
      </form>
    );

  return (
    <div className="account-maintenance">
      <button
        className="icon-button"
        type="button"
        aria-label={`Editar cuenta ${account.name}`}
        onClick={() => {
          setEditing(true);
          setArchiving(false);
        }}
      >
        <Pencil size={15} />
      </button>
      <button
        className="icon-button"
        type="button"
        aria-label={`Archivar cuenta ${account.name}`}
        onClick={() => {
          setArchiving(true);
          setEditing(false);
          setConfirmed(false);
        }}
      >
        <Archive size={15} />
      </button>
      {editing && (
        <form action={editAction} className="account-edit-form">
          <div className="inline-form-heading">
            <strong>Editar cuenta</strong>
            <button
              type="button"
              className="icon-button"
              aria-label="Cerrar edición"
              onClick={() => setEditing(false)}
            >
              <X size={15} />
            </button>
          </div>
          <label>
            Nombre
            <input
              name="name"
              defaultValue={account.name}
              maxLength={80}
              required
            />
          </label>
          <label>
            Tipo
            <select name="type" defaultValue={account.type}>
              {types.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saldo inicial ({account.currency})
            <input
              name="openingBalance"
              defaultValue={account.openingBalance}
              inputMode="decimal"
              pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
              required
            />
          </label>
          <p className="section-note">
            La moneda se conserva para proteger el historial.
          </p>
          {editState.error && (
            <p className="notice error" role="alert">
              {editState.error}
            </p>
          )}
          <button className="button primary" disabled={editingPending}>
            {editingPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}
      {archiving && (
        <form action={archiveAction} className="account-archive-form">
          <strong>Archivar {account.name}</strong>
          <p>
            La cuenta dejará de aceptar movimientos, pero conservará todo su
            historial.
          </p>
          <label>
            <input
              type="checkbox"
              name="confirmation"
              value="ARCHIVE"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
            />
            Confirmo que deseo archivarla
          </label>
          {archiveState.error && (
            <p className="notice error" role="alert">
              {archiveState.error}
            </p>
          )}
          <div>
            <button
              type="button"
              className="button subtle"
              onClick={() => setArchiving(false)}
            >
              Cancelar
            </button>
            <button
              className="button destructive"
              disabled={!confirmed || archivePending}
            >
              {archivePending ? 'Archivando…' : 'Archivar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
