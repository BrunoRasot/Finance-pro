import { z } from 'zod';
import { dateSchema } from '../transactions/model.ts';

const money = z
  .string()
  .regex(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/);

export const goalInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  currency: z.enum(['PEN', 'USD']),
  targetAmount: money,
  deadline: z.union([dateSchema, z.literal('')]),
});

export const goalUpdateSchema = goalInputSchema
  .omit({ currency: true })
  .extend({
    id: z.uuid(),
  })
  .strict();

export const contributionInputSchema = z.object({
  goalId: z.uuid(),
  amount: money,
  date: dateSchema,
  note: z.string().trim().max(250),
  idempotencyKey: z.uuidv4(),
});
