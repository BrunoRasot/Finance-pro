import { z } from 'zod';
import { categorySchema } from '../transactions/model.ts';
export const monthSchema = z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/);
const positiveAmount = z.string().regex(/^\d+\.\d{2}$/);
export const monthlyReportSchema = z.object({
  month: monthSchema,
  currencies: z.array(
    z.object({
      currency: z.enum(['PEN', 'USD']),
      income: positiveAmount,
      expense: positiveAmount,
      net: z.string().regex(/^-?\d+\.\d{2}$/),
      categories: z.array(
        z.object({
          type: z.enum(['INCOME', 'EXPENSE']),
          category: categorySchema,
          total: positiveAmount,
          count: z.string().regex(/^\d+$/),
        }),
      ),
    }),
  ),
});
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
export function currentMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  return `${parts.find((part) => part.type === 'year')!.value}-${parts.find((part) => part.type === 'month')!.value}`;
}
export function monthTitle(month: string) {
  const labels = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return `${labels[Number(month.slice(5)) - 1]} de ${month.slice(0, 4)}`;
}
export function categoryPercent(amount: string, total: string) {
  const integer = (value: string) => BigInt(value.replace('.', ''));
  const denominator = integer(total);
  if (denominator === 0n) return 0;
  return Number((integer(amount) * 10000n) / denominator) / 100;
}
