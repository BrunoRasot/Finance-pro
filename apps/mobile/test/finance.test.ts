import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { amount } from '../src/lib/money.ts';
import { IdempotentOperation } from '../src/lib/idempotent-operation.ts';
import { validNewPassword } from '../src/lib/password.ts';

test('router decoder handles Unicode and malformed escapes with the security update', () => {
  const localRequire = createRequire(import.meta.url);
  const routerRequire = createRequire(
    localRequire.resolve('expo-router/package.json'),
  );
  const query = routerRequire('query-string') as {
    parse(value: string): Record<string, unknown>;
  };
  const parsed = query.parse('name=caf%C3%A9&invalid=%E0%A4%A');
  assert.equal(parsed.name, 'café');
  assert.equal(typeof parsed.invalid, 'string');
});

test('xcode can still load the patched UUID generator through CommonJS', () => {
  const localRequire = createRequire(import.meta.url);
  const expoRequire = createRequire(localRequire.resolve('expo/package.json'));
  const pluginsRequire = createRequire(
    expoRequire.resolve('@expo/config-plugins/package.json'),
  );
  const xcodeRequire = createRequire(
    pluginsRequire.resolve('xcode/package.json'),
  );
  const uuid = xcodeRequire('uuid') as { v4(): string };
  assert.match(
    uuid.v4(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});

test('new passwords use the same length limits as the web', () => {
  assert.equal(validNewPassword('a'.repeat(11)), false);
  assert.equal(validNewPassword('a'.repeat(12)), false);
  assert.equal(validNewPassword('Segura#2026!!'), true);
  assert.equal(validNewPassword(`A1!${'a'.repeat(125)}`), true);
  assert.equal(validNewPassword('a'.repeat(129)), false);
});

test('preserves cents beyond Number precision and for negative fractions', () => {
  assert.equal(
    amount('9999999999999999.99', 'PEN'),
    'S/ 9,999,999,999,999,999.99',
  );
  assert.equal(amount('-0.01', 'USD'), 'US$ -0.01');
  assert.equal(amount('12.5', 'PEN'), 'S/ 12.50');
});

test('rejects malformed amounts instead of displaying NaN or rounding', () => {
  for (const value of ['NaN', '1e4', '1.999', ''])
    assert.throws(() => amount(value, 'PEN'));
});

test('lost response retries the same payload and key even across midnight', async () => {
  const bodies: string[] = [];
  let keys = 0;
  const operation = new IdempotentOperation(
    async (_path, init) => {
      bodies.push(String(init.body));
      if (bodies.length === 1) throw new Error('connection lost after commit');
    },
    () => `key-${++keys}`,
  );
  await assert.rejects(
    operation.run('/transfers', { amount: '20.01', date: '2026-09-07' }),
  );
  assert.equal(operation.pendingPath, '/transfers');
  await operation.run('/transfers', { amount: '99', date: '2026-09-08' });
  assert.equal(bodies[0], bodies[1]);
  assert.equal(keys, 1);
  assert.equal(operation.pendingPath, null);
  await operation.run('/transfers', { amount: '20.01' });
  assert.equal(keys, 2);
});

test('validation failure unlocks a new request, but uncertain outcomes stay pending', async () => {
  let status = 400;
  const operation = new IdempotentOperation(
    async () => {
      throw Object.assign(new Error('failed'), { status });
    },
    () => 'key',
  );
  await assert.rejects(operation.run('/goals/a/contributions', {}));
  assert.equal(operation.pendingPath, null);
  status = 500;
  await assert.rejects(operation.run('/goals/a/contributions', {}));
  status = 401;
  await assert.rejects(operation.run('/goals/a/contributions', {}));
  assert.equal(operation.pendingPath, '/goals/a/contributions');
  await assert.rejects(
    operation.run('/goals/b/contributions', {}),
    /pendiente/,
  );
});

test('double taps cannot issue concurrent requests', async () => {
  let finish!: () => void;
  let requests = 0;
  const operation = new IdempotentOperation(
    () => {
      requests++;
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    },
    () => 'key',
  );
  const first = operation.run('/transfers', {});
  await assert.rejects(operation.run('/transfers', {}), /curso/);
  assert.equal(requests, 1);
  finish();
  await first;
});
