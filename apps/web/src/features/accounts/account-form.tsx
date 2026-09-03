'use client';
import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { createAccount } from './actions';
export function AccountForm() {
  const [state, action, pending] = useActionState(createAccount, {});
  return (
    <form action={action} className="auth-form">
      <label>
        Nombre
        <input
          name="name"
          placeholder="Ej. Cuenta principal"
          required
          maxLength={80}
        />
      </label>
      <div className="form-grid">
        <label>
          Tipo
          <select name="type">
            <option value="BANK">Banco</option>
            <option value="CASH">Efectivo</option>
            <option value="WALLET">Billetera digital</option>
          </select>
        </label>
        <label>
          Moneda
          <select name="currency">
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </label>
      </div>
      <label>
        Saldo inicial
        <input
          name="openingBalance"
          defaultValue="0.00"
          inputMode="decimal"
          pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
          required
        />
        <small>Usa un punto para los decimales. Ejemplo: 150.50</small>
      </label>
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice success">
          {state.success}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        <Plus size={18} />
        {pending ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  );
}
