import { z } from 'zod';
import { monthSchema } from '../reports/model.ts';

export const budgetCategories = {
  FOOD: 'Alimentación',
  TRANSPORT: 'Transporte',
  HOUSING: 'Vivienda',
  HEALTH: 'Salud',
  EDUCATION: 'Educación',
  ENTERTAINMENT: 'Entretenimiento',
  OTHER: 'Otros',
} as const;

export const budgetCategorySchema = z.enum(
  Object.keys(budgetCategories) as [
    keyof typeof budgetCategories,
    ...(keyof typeof budgetCategories)[],
  ],
);

export const budgetInputSchema = z.object({
  month: monthSchema,
  currency: z.enum(['PEN', 'USD']),
  category: budgetCategorySchema,
  amount: z
    .string()
    .regex(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/),
});
