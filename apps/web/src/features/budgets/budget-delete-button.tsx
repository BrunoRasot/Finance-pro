'use client';

import { Trash2 } from 'lucide-react';
import { deleteBudget } from './actions';

export function BudgetDeleteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form
      action={deleteBudget}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar el presupuesto de ${label}?`))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="icon-button"
        aria-label={`Eliminar presupuesto de ${label}`}
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
