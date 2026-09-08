'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import { saveBudget } from './actions';
import { budgetCategories } from './model';

export function BudgetForm({ month }: { month: string }) {
  const [state, action, pending] = useActionState(saveBudget, {});
  return (
    <form action={action} className="auth-form budget-form">
      <input type="hidden" name="month" value={month} />
      <label>
        Categoría
        <select name="category" defaultValue="FOOD">
          {Object.entries(budgetCategories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
        Límite mensual
        <input
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
          required
        />
        <small>Si ya existe, su límite se actualizará.</small>
      </label>
      {state.error && <p className="notice error">{state.error}</p>}
      {state.success && <p className="notice success">{state.success}</p>}
      <button className="button primary" disabled={pending}>
        <Save size={17} /> {pending ? 'Guardando…' : 'Guardar presupuesto'}
      </button>
    </form>
  );
}
