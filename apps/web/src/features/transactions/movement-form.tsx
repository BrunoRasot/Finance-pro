'use client';
import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { createMovement, type MovementState } from './actions';
import { categories, type TransactionInput } from './model';
export function MovementForm({
  accountId,
  currency,
  initialKey,
}: {
  accountId: string;
  currency: 'PEN' | 'USD';
  initialKey: string;
}) {
  const [values, setValues] = useState<TransactionInput>({
    type: 'EXPENSE',
    category: 'FOOD',
    amount: '',
    date: '',
    description: '',
    idempotencyKey: initialKey,
  });
  const [state, action, pending] = useActionState<MovementState, FormData>(
    async (previous) => {
      const form = new FormData();
      Object.entries(values).forEach(([key, value]) => form.set(key, value));
      try {
        const result = await createMovement(accountId, form);
        if (result.success)
          setValues((current) => ({
            ...current,
            amount: '',
            description: '',
            idempotencyKey: crypto.randomUUID(),
          }));
        // Keep an uncertain request frozen, even if a later retry is rate limited.
        return previous.uncertain && !result.success
          ? { ...result, uncertain: true }
          : result;
      } catch {
        return {
          error:
            'No pudimos confirmar el envío. Reintenta sin cerrar esta página.',
          uncertain: true,
        };
      }
    },
    {},
  );
  const update = (key: keyof TransactionInput, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  return (
    <form action={action} className="auth-form">
      <fieldset
        className="movement-fields"
        disabled={pending || state.uncertain}
      >
        <label>
          Tipo de movimiento
          <select
            value={values.type}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                type: e.target.value as TransactionInput['type'],
                category: e.target.value === 'INCOME' ? 'SALARY' : 'FOOD',
              }))
            }
          >
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
        </label>
        <label>
          Importe ({currency})
          <input
            value={values.amount}
            onChange={(e) => update('amount', e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            required
            pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
          />
          <small>Mayor que cero. Usa un punto para los decimales.</small>
        </label>
        <label>
          Categoría
          <select
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {Object.entries(categories)
              .filter(
                ([, value]) =>
                  value.type === 'BOTH' || value.type === values.type,
              )
              .map(([key, value]) => (
                <option value={key} key={key}>
                  {value.label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Fecha
          <input
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            required
            value={values.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </label>
        <label>
          Descripción <span className="optional">Opcional</span>
          <input
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            maxLength={250}
            placeholder="¿En qué consistió?"
          />
        </label>
      </fieldset>
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
      {state.uncertain && (
        <p className="section-note">
          Conservamos los datos del envío. Comprueba el historial antes de
          cerrar o recargar esta página.
        </p>
      )}
      <button className="button primary" disabled={pending}>
        <Plus size={18} />
        {pending
          ? 'Guardando…'
          : state.uncertain
            ? 'Reintentar el mismo envío'
            : 'Guardar movimiento'}
      </button>
    </form>
  );
}
