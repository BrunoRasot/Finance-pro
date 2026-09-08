'use client';
import { useActionState, useState } from 'react';
import { Archive, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import type { SavingsGoal } from '@/lib/goals';
import {
  contributeGoal,
  setGoalArchived,
  updateGoal,
  type GoalState,
} from './actions';
export function GoalActions({ goal }: { goal: SavingsGoal }) {
  const [dialog, setDialog] = useState<'edit' | 'contribute' | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [editState, editAction, editing] = useActionState(updateGoal, {});
  const [addState, addAction, adding] = useActionState(
    async (previous: GoalState, form: FormData) => {
      const result = await contributeGoal(previous, form);
      if (result.success) setKey(crypto.randomUUID());
      return result;
    },
    {},
  );
  if (goal.archivedAt)
    return (
      <form action={setGoalArchived}>
        <input type="hidden" name="id" value={goal.id} />
        <input type="hidden" name="action" value="restore" />
        <button className="button subtle">
          <RotateCcw size={15} />
          Restaurar
        </button>
      </form>
    );
  return (
    <div className="goal-actions">
      <button
        className="button primary"
        onClick={() => setDialog('contribute')}
      >
        <Plus size={15} />
        Aportar
      </button>
      <button
        className="icon-button"
        aria-label={`Editar ${goal.name}`}
        onClick={() => setDialog('edit')}
      >
        <Pencil size={15} />
      </button>
      <form
        action={setGoalArchived}
        onSubmit={(event) => {
          if (!window.confirm(`¿Archivar la meta ${goal.name}?`))
            event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={goal.id} />
        <input type="hidden" name="action" value="archive" />
        <button className="icon-button" aria-label={`Archivar ${goal.name}`}>
          <Archive size={15} />
        </button>
      </form>
      {dialog && (
        <div className="modal-backdrop">
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={dialog === 'edit' ? 'Editar meta' : 'Registrar aporte'}
          >
            <button
              className="modal-close"
              aria-label="Cerrar"
              onClick={() => setDialog(null)}
            >
              <X size={18} />
            </button>
            <h2>{dialog === 'edit' ? 'Editar meta' : 'Nuevo aporte'}</h2>
            {dialog === 'edit' ? (
              <form action={editAction} className="auth-form">
                <input type="hidden" name="id" value={goal.id} />
                <label>
                  Nombre
                  <input
                    name="name"
                    defaultValue={goal.name}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Objetivo ({goal.currency})
                  <input
                    name="targetAmount"
                    defaultValue={goal.targetAmount}
                    inputMode="decimal"
                    required
                  />
                </label>
                <label>
                  Fecha objetivo <span className="optional">Opcional</span>
                  <input
                    name="deadline"
                    type="date"
                    defaultValue={goal.deadline ?? ''}
                  />
                </label>
                {editState.error && (
                  <p className="notice error">{editState.error}</p>
                )}
                <button className="button primary" disabled={editing}>
                  {editing ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </form>
            ) : (
              <form action={addAction} className="auth-form">
                <input type="hidden" name="goalId" value={goal.id} />
                <input type="hidden" name="idempotencyKey" value={key} />
                <label>
                  Importe ({goal.currency})
                  <input
                    name="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  Fecha
                  <input name="date" type="date" required />
                </label>
                <label>
                  Nota <span className="optional">Opcional</span>
                  <input name="note" maxLength={250} />
                </label>
                {addState.error && (
                  <p className="notice error">{addState.error}</p>
                )}
                {addState.success && (
                  <p className="notice success">{addState.success}</p>
                )}
                <button
                  className="button primary"
                  disabled={adding || addState.uncertain}
                >
                  {adding ? 'Registrando…' : 'Registrar aporte'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
