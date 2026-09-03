import { validateEnvironment } from './environment';

describe('Environment validation', () => {
  it('rejects malformed database settings without leaking their values', () => {
    expect(() =>
      validateEnvironment({ DATABASE_URL: 'private-value' }),
    ).toThrow(/^Invalid environment variables: DATABASE_URL$/);
  });

  it('requires database and authentication settings in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL, SUPABASE_URL',
    );
  });

  it('rejects an invalid Supabase origin even in test mode', () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: 'test', SUPABASE_URL: 'private-value' }),
    ).toThrow(/^Invalid environment variables: SUPABASE_URL$/);
  });
  it('defaults to a local listener and no browser origins', () => {
    expect(validateEnvironment({})).toMatchObject({
      HOST: '127.0.0.1',
      PORT: 3001,
      CORS_ORIGINS: [],
    });
  });

  it('parses numeric settings and exact origins', () => {
    expect(
      validateEnvironment({
        PORT: '4000',
        CORS_ORIGINS: 'http://localhost:3000, https://finance.example',
      }),
    ).toMatchObject({
      PORT: 4000,
      CORS_ORIGINS: ['http://localhost:3000', 'https://finance.example'],
    });
  });

  it.each(['', '0', '65536', '3001.5', 'invalid'])(
    'rejects invalid port %j',
    (PORT) => {
      expect(() => validateEnvironment({ PORT })).toThrow('PORT');
    },
  );

  it.each([
    '*',
    'null',
    'https://example.com/path',
    'https://example.com/',
    'https://user:password@example.com',
    'https://example.com,',
  ])('rejects unsafe or ambiguous origin %j', (CORS_ORIGINS) => {
    expect(() => validateEnvironment({ CORS_ORIGINS })).toThrow('CORS_ORIGINS');
  });

  it('requires HTTPS for production browser origins', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'http://example.com',
      }),
    ).toThrow('CORS_ORIGINS');
  });

  it('does not include configuration values in errors', () => {
    expect(() => validateEnvironment({ PORT: 'private-value' })).toThrow(
      /^Invalid environment variables: PORT$/,
    );
  });
});
