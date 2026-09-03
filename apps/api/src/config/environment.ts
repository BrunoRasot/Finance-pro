import { z } from 'zod';

function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  } catch {
    return false;
  }
}

function isDatabaseUrl(value: string): boolean {
  try {
    return ['postgres:', 'postgresql:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.enum(['127.0.0.1', '0.0.0.0', '::1', '::']).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().refine(isDatabaseUrl).optional(),
    SUPABASE_URL: z.string().refine(isOrigin).optional(),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value === '' ? [] : value.split(',').map((origin) => origin.trim()),
      )
      .pipe(z.array(z.string().refine(isOrigin))),
    RATE_LIMIT_TTL_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(3600000)
      .default(60000),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(60),
  })
  .superRefine((env, context) => {
    if (env.SUPABASE_URL && !env.SUPABASE_URL.startsWith('https://')) {
      const localTest =
        env.NODE_ENV === 'test' &&
        isOrigin(env.SUPABASE_URL) &&
        new URL(env.SUPABASE_URL).hostname === '127.0.0.1';
      if (!localTest)
        context.addIssue({
          code: 'custom',
          path: ['SUPABASE_URL'],
          message: 'HTTPS required',
        });
    }
    if (env.NODE_ENV === 'production') {
      for (const key of ['DATABASE_URL', 'SUPABASE_URL'] as const) {
        if (!env[key])
          context.addIssue({
            code: 'custom',
            path: [key],
            message: 'Required in production',
          });
      }
    }
    if (
      env.NODE_ENV === 'production' &&
      env.CORS_ORIGINS.some((origin) => !origin.startsWith('https://'))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'Production origins require HTTPS',
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    // Report variable names only; configuration values may contain secrets.
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(`Invalid environment variables: ${fields.join(', ')}`);
  }
  return result.data;
}
