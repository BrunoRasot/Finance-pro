import { z } from 'zod';
import { dateSchema } from '../transactions/model.ts';

export const transferInputSchema = z
  .object({
    fromAccountId: z.uuid(),
    toAccountId: z.uuid(),
    amount: z
      .string()
      .regex(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/),
    date: dateSchema,
    description: z.string().trim().max(250),
    idempotencyKey: z.uuidv4(),
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    message: 'Las cuentas deben ser diferentes.',
  });

export type TransferInput = z.infer<typeof transferInputSchema>;
