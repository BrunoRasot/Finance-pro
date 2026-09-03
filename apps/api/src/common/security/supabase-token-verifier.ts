import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWTVerifyGetKey } from 'jose' with {
  'resolution-mode': 'import',
};
import type { Environment } from '../../config/environment';
import { TokenVerifier, type Identity } from './token-verifier';

@Injectable()
export class SupabaseTokenVerifier extends TokenVerifier {
  private keys?: JWTVerifyGetKey;
  constructor(private readonly config: ConfigService<Environment, true>) {
    super();
  }

  async verify(token: string): Promise<Identity> {
    const url = this.config.get('SUPABASE_URL', { infer: true });
    if (!url || token.length > 16384) throw new UnauthorizedException();
    try {
      const { createRemoteJWKSet, jwtVerify } = await import('jose');
      this.keys ??= createRemoteJWKSet(
        new URL(`${url}/auth/v1/.well-known/jwks.json`),
        {
          timeoutDuration: 3000,
          cacheMaxAge: 600000,
          cooldownDuration: 30000,
        },
      );
      const { payload } = await jwtVerify(token, this.keys, {
        issuer: `${url}/auth/v1`,
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
        requiredClaims: ['sub', 'exp', 'iat', 'role'],
      });
      if (
        !payload.sub ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          payload.sub,
        ) ||
        payload.role !== 'authenticated' ||
        payload.is_anonymous === true
      )
        throw new UnauthorizedException();
      return { userId: payload.sub };
    } catch {
      // Never log the token, claims, keys or upstream response.
      throw new UnauthorizedException();
    }
  }
}
