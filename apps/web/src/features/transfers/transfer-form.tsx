'use client';

import { useActionState, useMemo, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type { Account } from '@/lib/accounts';
import { createTransfer, type TransferState } from './actions';

export function TransferForm({ accounts }: { accounts: Account[] }) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const source = accounts.find((account) => account.id === fromId);
  const targets = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.id !== fromId && account.currency === source?.currency,
      ),
    [accounts, fromId, source?.currency],
  );
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(
    async (previous: TransferState, form: FormData) => {
      const result = await createTransfer(previous, form);
      if (result.success) setKey(crypto.randomUUID());
      return result;
    },
    {},
  );
  const ready = Boolean(source && targets.length) && !state.uncertain;

  return (
    <form action={action} className="auth-form transfer-form">
      <input type="hidden" name="idempotencyKey" value={key} />
      <label>
        Desde
        <select
          name="fromAccountId"
          value={fromId}
          onChange={(event) => setFromId(event.target.value)}
          required
        >
          {accounts.map((account) => (
            <option value={account.id} key={account.id}>
              {account.name} · {account.currency}
            </option>
          ))}
        </select>
      </label>
      <label>
        Hacia
        <select name="toAccountId" key={fromId} required disabled={!ready}>
          {targets.map((account) => (
            <option value={account.id} key={account.id}>
              {account.name} · {account.currency}
            </option>
          ))}
        </select>
        {!ready && (
          <small>Necesitas otra cuenta activa en la misma moneda.</small>
        )}
      </label>
      <div className="form-grid">
        <label>
          Importe ({source?.currency ?? '—'})
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
            required
          />
        </label>
        <label>
          Fecha
          <input name="date" type="date" required />
        </label>
      </div>
      <label>
        Descripción <span className="optional">Opcional</span>
        <input
          name="description"
          maxLength={250}
          placeholder="Ej. Fondo mensual"
        />
      </label>
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
      <button className="button primary" disabled={pending || !ready}>
        {pending ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <ArrowRight size={18} />
        )}
        {pending ? 'Transfiriendo…' : 'Transferir dinero'}
      </button>
    </form>
  );
}
