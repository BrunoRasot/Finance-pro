import { z } from 'zod';

export const emailSchema = z.email().max(254);
export const passwordSchema = z.string().min(12).max(128);
export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const newAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['CASH', 'BANK', 'WALLET']),
  currency: z.enum(['PEN', 'USD']),
  openingBalance: z.string().regex(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/),
});
export function safeDestination(value: string | null) {
  return value === '/actualizar-contrasena' ? value : '/cuentas';
}
export function formatAmount(amount: string, currency: 'PEN' | 'USD') {
  const negative = amount.startsWith('-');
  const [whole, fraction = '00'] = amount.replace(/^-/, '').split('.');
  return `${currency === 'PEN' ? 'S/' : 'US$'} ${negative ? '-' : ''}${new Intl.NumberFormat('en-US').format(BigInt(whole))}.${fraction.padEnd(2, '0')}`;
}
