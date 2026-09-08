'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { apiRequest } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import {
  contributionInputSchema,
  goalInputSchema,
  goalUpdateSchema,
} from './model';

export type GoalState = {
  error?: string;
  success?: string;
  uncertain?: boolean;
};
const refresh = () => revalidatePath('/metas');

async function send(path: string, method: string, body?: object) {
  return apiRequest(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function createGoal(
  _previous: GoalState,
  form: FormData,
): Promise<GoalState> {
  await requireUser();
  const parsed = goalInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Revisa el nombre, objetivo y fecha.' };
  const data = { ...parsed.data, deadline: parsed.data.deadline || null };
  try {
    const response = await send('/goals', 'POST', data);
    if (!response.ok) return { error: 'No pudimos crear la meta.' };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'No pudimos guardar la meta. Revisa tu conexión e inténtalo nuevamente.',
    };
  }
  refresh();
  return { success: 'Meta creada.' };
}

export async function updateGoal(
  _previous: GoalState,
  form: FormData,
): Promise<GoalState> {
  await requireUser();
  const parsed = goalUpdateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Revisa los datos de la meta.' };
  const { id, ...values } = parsed.data;
  const response = await send(`/goals/${id}`, 'PATCH', {
    ...values,
    deadline: values.deadline || null,
  });
  if (!response.ok)
    return {
      error:
        response.status === 404
          ? 'La meta ya no está disponible.'
          : 'No pudimos actualizar la meta.',
    };
  refresh();
  return { success: 'Meta actualizada.' };
}

export async function contributeGoal(
  _previous: GoalState,
  form: FormData,
): Promise<GoalState> {
  await requireUser();
  const parsed = contributionInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Revisa el importe y la fecha.' };
  const { goalId, ...data } = parsed.data;
  try {
    const response = await send(`/goals/${goalId}/contributions`, 'POST', data);
    if (response.status === 409)
      return { error: 'Este aporte ya se utilizó con otros datos.' };
    if (!response.ok) return { error: 'No pudimos registrar el aporte.' };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        'No pudimos confirmar el aporte. Revisa la meta antes de reintentar.',
      uncertain: true,
    };
  }
  refresh();
  return { success: 'Aporte registrado.' };
}

export async function setGoalArchived(form: FormData): Promise<void> {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), action: z.enum(['archive', 'restore']) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const response = await send(
    `/goals/${parsed.data.id}/${parsed.data.action}`,
    'POST',
  );
  if (!response.ok && response.status !== 404)
    throw new Error('Goal status update failed');
  refresh();
}
