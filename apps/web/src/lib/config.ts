import 'server-only';
import { z } from 'zod';

export function getConfig() {
  const result = z
    .object({
      SUPABASE_URL: z.url().refine((s) => s.startsWith('https://')),
      SUPABASE_PUBLISHABLE_KEY: z
        .string()
        .startsWith('sb_publishable_')
        .min(25),
      APP_ORIGIN: z.url().refine((s) => new URL(s).origin === s),
      API_BASE_URL: z.url(),
    })
    .safeParse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
      APP_ORIGIN: process.env.APP_ORIGIN ?? 'http://localhost:3000',
      API_BASE_URL: process.env.API_BASE_URL ?? 'http://127.0.0.1:3001/api/v1',
    });
  if (!result.success)
    throw new Error('Web environment configuration is incomplete.');
  return result.data;
}
