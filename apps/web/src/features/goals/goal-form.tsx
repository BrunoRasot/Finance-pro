'use client';
import { useActionState } from 'react';
import { Target } from 'lucide-react';
import { createGoal } from './actions';
export function GoalForm() {
  const [state, action, pending] = useActionState(createGoal, {});
  return (
    <form action={action} className="auth-form goal-form">
      <label>
        Nombre
        <input
          name="name"
          maxLength={100}
          placeholder="Ej. Fondo de emergencia"
          required
        />
      </label>
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
        Objetivo
        <input
          name="targetAmount"
          inputMode="decimal"
          placeholder="0.00"
          pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
          required
        />
      </label>
      <label>
        Fecha objetivo <span className="optional">Opcional</span>
        <input name="deadline" type="date" />
      </label>
      {state.error && <p className="notice error">{state.error}</p>}
      {state.success && <p className="notice success">{state.success}</p>}
      <button className="button primary" disabled={pending}>
        <Target size={17} />
        {pending ? 'Creando…' : 'Crear meta'}
      </button>
    </form>
  );
}
