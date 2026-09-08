import { z } from 'zod';
export const categories = {
  SALARY: { label: 'Sueldo', type: 'INCOME' },
  FREELANCE: { label: 'Trabajo independiente', type: 'INCOME' },
  FOOD: { label: 'Alimentación', type: 'EXPENSE' },
  TRANSPORT: { label: 'Transporte', type: 'EXPENSE' },
  HOUSING: { label: 'Vivienda', type: 'EXPENSE' },
  HEALTH: { label: 'Salud', type: 'EXPENSE' },
  EDUCATION: { label: 'Educación', type: 'EXPENSE' },
  ENTERTAINMENT: { label: 'Entretenimiento', type: 'EXPENSE' },
  OTHER: { label: 'Otros', type: 'BOTH' },
} as const;
export const historyCategories = {
  ...categories,
  TRANSFER: { label: 'Transferencia', type: 'BOTH' },
} as const;
export const categorySchema = z.enum([
  'SALARY',
  'FREELANCE',
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'OTHER',
]);
export const historyCategorySchema = z.enum([
  ...categorySchema.options,
  'TRANSFER',
]);
export const dateSchema = z.iso
  .date()
  .refine((value) => !value.startsWith('0000'));
const transactionFieldsSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: categorySchema,
  amount: z
    .string()
    .regex(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/),
  date: dateSchema,
  description: z.string().trim().max(250),
});
const categoryMatchesType = (value: {
  type: 'INCOME' | 'EXPENSE';
  category: keyof typeof categories;
}) =>
  categories[value.category].type === 'BOTH' ||
  categories[value.category].type === value.type;
export const transactionInputSchema = transactionFieldsSchema
  .extend({ idempotencyKey: z.uuidv4() })
  .refine(categoryMatchesType, {
    message: 'La categoría no corresponde al tipo.',
  });
export type TransactionInput = z.infer<typeof transactionInputSchema>;
export const transactionChangesSchema = transactionFieldsSchema.refine(
  categoryMatchesType,
  { message: 'La categoría no corresponde al tipo.' },
);
export type TransactionChanges = z.infer<typeof transactionChangesSchema>;
export const filtersSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: historyCategorySchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    page: z.coerce.number().int().min(1).max(501).default(1),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'La fecha inicial debe ser anterior o igual a la final.',
  });
export type Filters = z.infer<typeof filtersSchema>;
export function historyQuery(filters: Filters, page = filters.page) {
  const query = new URLSearchParams();
  for (const key of ['type', 'category', 'from', 'to'] as const)
    if (filters[key]) query.set(key, filters[key]);
  query.set('page', String(page));
  return query.toString();
}
export function displayDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
