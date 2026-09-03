import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from '../src/config/environment';
import { SupabaseTokenVerifier } from '../src/common/security/supabase-token-verifier';
import { createJwksServer } from './support/jwks-server';

describe('Supabase JWT verification with real signatures and JWKS HTTP', () => {
  let issuer: Awaited<ReturnType<typeof createJwksServer>>;
  let verifier: SupabaseTokenVerifier;
  const userId = randomUUID();

  beforeAll(async () => {
    issuer = await createJwksServer();
    verifier = new SupabaseTokenVerifier(
      new ConfigService(
        validateEnvironment({ NODE_ENV: 'test', SUPABASE_URL: issuer.url }),
      ),
    );
  });
  afterAll(async () => {
    await issuer.close();
  });

  it('accepts a valid signed user access token', async () => {
    await expect(verifier.verify(await issuer.issue(userId))).resolves.toEqual({
      userId,
    });
  });

  it.each([
    { exp: 1 },
    { exp: undefined },
    { iss: 'https://other.example/auth/v1' },
    { aud: 'other' },
    { role: 'service_role' },
    { sub: 'invalid' },
    { is_anonymous: true },
    { nbf: 9999999999 },
  ])('rejects invalid claims %j', async (claims) => {
    await expect(
      verifier.verify(await issuer.issue(userId, claims)),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects a token signed with an unrelated key', async () => {
    const attacker = await createJwksServer();
    try {
      const token = await attacker.issue(userId, {
        iss: `${issuer.url}/auth/v1`,
      });
      await expect(verifier.verify(token)).rejects.toThrow('Unauthorized');
    } finally {
      await attacker.close();
    }
  });

  it('rejects unsigned or malformed tokens', async () => {
    await expect(verifier.verify('fabricated-token')).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('fails closed without a configured Supabase project', async () => {
    const unconfigured = new SupabaseTokenVerifier(
      new ConfigService(validateEnvironment({})),
    );
    await expect(
      unconfigured.verify(await issuer.issue(userId)),
    ).rejects.toThrow('Unauthorized');
  });
});
