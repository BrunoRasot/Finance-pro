import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

export async function createJwksServer() {
  const { generateKeyPair, exportJWK, SignJWT } = await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  const jwk = {
    ...(await exportJWK(publicKey)),
    kid: 'test-key',
    alg: 'ES256',
    use: 'sig',
  };
  const server = createServer((request, response) => {
    if (request.url !== '/auth/v1/.well-known/jwks.json') {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url,
    issue: (userId: string, overrides: Record<string, unknown> = {}) =>
      new SignJWT({
        sub: userId,
        role: 'authenticated',
        aud: 'authenticated',
        iss: `${url}/auth/v1`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        ...overrides,
      })
        .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
        .sign(privateKey),
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
