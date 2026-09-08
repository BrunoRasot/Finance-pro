'use client';

import { useActionState, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { deleteMovement, updateMovement, type MovementState } from './actions';
import { categories, type TransactionChanges } from './model';

type Movement = TransactionChanges & { id: string };
export function MovementActions({
  accountId,
  movement,
}: {
  accountId: string;
  movement: Movement;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [type, setType] = useState(movement.type);
  const [category, setCategory] = useState(movement.category);
  const [updateState, updateAction, updating] = useActionState<
    MovementState,
    FormData
  >(async (_previous, form) => {
    const result = await updateMovement(accountId, movement.id, form);
    if (result.success) setEditing(false);
    return result;
  }, {});
  const [deleteState, deleteAction, deleting] = useActionState<
    MovementState,
    FormData
  >(
    async (_previous, form) => deleteMovement(accountId, movement.id, form),
    {},
  );
  return (
    <div className="movement-actions">
      <div className="movement-action-buttons">
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            setEditing(!editing);
            setRemoving(false);
          }}
          aria-expanded={editing}
          aria-label={`Editar movimiento ${movement.description || ''}`}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          className="icon-button danger-button"
          onClick={() => {
            setRemoving(!removing);
            setEditing(false);
            setConfirmed(false);
          }}
          aria-expanded={removing}
          aria-label={`Eliminar movimiento ${movement.description || ''}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {editing && (
        <form action={updateAction} className="movement-edit-form">
          <div className="inline-form-heading">
            <strong>Editar movimiento</strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => setEditing(false)}
              aria-label="Cerrar edición"
            >
              <X size={15} />
            </button>
          </div>
          <label>
            Tipo
            <select
              name="type"
              value={type}
              onChange={(event) => {
                const nextType = event.target
                  .value as TransactionChanges['type'];
                setType(nextType);
                if (
                  categories[category].type !== 'BOTH' &&
                  categories[category].type !== nextType
                )
                  setCategory(nextType === 'INCOME' ? 'SALARY' : 'FOOD');
              }}
            >
              <option value="EXPENSE">Gasto</option>
              <option value="INCOME">Ingreso</option>
            </select>
          </label>
          <label>
            Categoría
            <select
              name="category"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as TransactionChanges['category'],
                )
              }
            >
              {Object.entries(categories)
                .filter(
                  ([, value]) => value.type === 'BOTH' || value.type === type,
                )
                .map(([key, value]) => (
                  <option value={key} key={key}>
                    {value.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Importe
            <input
              name="amount"
              defaultValue={movement.amount}
              inputMode="decimal"
              required
              pattern="(0|[1-9][0-9]{0,15})(\.[0-9]{1,2})?"
            />
          </label>
          <label>
            Fecha
            <input
              name="date"
              type="date"
              defaultValue={movement.date}
              required
            />
          </label>
          <label className="edit-description">
            Descripción
            <input
              name="description"
              defaultValue={movement.description}
              maxLength={250}
            />
          </label>
          {updateState.error && (
            <p className="notice error" role="alert">
              {updateState.error}
            </p>
          )}
          <button className="button primary" disabled={updating}>
            {updating ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}
      {removing && (
        <form action={deleteAction} className="movement-delete-form">
          <strong>Eliminar movimiento</strong>
          <p>Esta acción cambiará el saldo y no se puede deshacer.</p>
          <label>
            <input
              type="checkbox"
              name="confirmation"
              value="DELETE"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
            />{' '}
            Confirmo que deseo eliminarlo
          </label>
          {deleteState.error && (
            <p className="notice error" role="alert">
              {deleteState.error}
            </p>
          )}
          <div>
            <button
              type="button"
              className="button subtle"
              onClick={() => setRemoving(false)}
            >
              Cancelar
            </button>
            <button
              className="button destructive"
              disabled={deleting || !confirmed}
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
