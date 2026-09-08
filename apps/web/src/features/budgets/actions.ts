'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { budgetInputSchema } from './model';

export type BudgetState = { error?: string; success?: string };

export async function saveBudget(
  _previous: BudgetState,
  form: FormData,
): Promise<BudgetState> {
  await requireUser();
  const parsed = budgetInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Revisa el mes, la categoría, la moneda y el importe.' };
  try {
    const response = await apiRequest('/budgets', {
      method: 'PUT',
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 429)
      return { error: 'Espera un momento antes de volver a guardar.' };
    if (!response.ok) return { error: 'No pudimos guardar el presupuesto.' };
  } catch (error) {
    unstable_rethrow(error);
    return { error: 'No pudimos conectar con el servidor.' };
  }
  revalidatePath('/presupuestos');
  return { success: 'Presupuesto guardado.' };
}

export async function deleteBudget(form: FormData): Promise<void> {
  await requireUser();
  const parsed = z.uuid().safeParse(form.get('id'));
  if (!parsed.success) return;
  const response = await apiRequest(`/budgets/${parsed.data}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404)
    throw new Error('Budget deletion failed');
  revalidatePath('/presupuestos');
}
