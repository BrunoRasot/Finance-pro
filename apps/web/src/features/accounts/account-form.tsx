'use client';
import { useActionState } from 'react';
import { Plus, Banknote, Landmark, Wallet } from 'lucide-react';
import { createAccount } from './actions';
export function AccountForm() {
  const [state, action, pending] = useActionState(createAccount, {});
  return (
    <form action={action} className="auth-form new-account-form">
      <label>
        Nombre
        <input
          name="name"
          placeholder="Ej. Cuenta principal"
          required
          maxLength={80}
        />
      </label>
      <fieldset className="account-choice-field">
        <legend>Tipo de cuenta</legend>
        <div className="account-type-options">
          {[
            { value: 'BANK', label: 'Banco', Icon: Landmark },
            { value: 'CASH', label: 'Efectivo', Icon: Banknote },
            { value: 'WALLET', label: 'Billetera', Icon: Wallet },
          ].map(({ value, label, Icon }) => (
            <label key={value}>
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={value === 'BANK'}
              />
              <span>
                <Icon size={19} />
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="account-choice-field">
        <legend>Moneda</legend>
        <div className="account-currency-options">
          <label>
            <input type="radio" name="currency" value="PEN" defaultChecked />
            <span>
              <strong>S/</strong> Soles <small>PEN</small>
            </span>
          </label>
          <label>
            <input type="radio" name="currency" value="USD" />
            <span>
              <strong>$</strong> Dólares <small>USD</small>
            </span>
          </label>
        </div>
      </fieldset>
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
