import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newAccountSchema,
  safeDestination,
  formatAmount,
  credentialsSchema,
  accountChangesSchema,
} from '../src/lib/validation.ts';
test('callback never redirects to untrusted origins or paths', () => {
  for (const value of [
    null,
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/cuentas?next=https://evil.example',
    '/admin',
  ])
    assert.equal(safeDestination(value), '/cuentas');
  assert.equal(
    safeDestination('/actualizar-contrasena'),
    '/actualizar-contrasena',
  );
});
test('amount formatting preserves cents above Number safe integer range', () => {
  assert.equal(
    formatAmount('9999999999999999.99', 'PEN'),
    'S/ 9,999,999,999,999,999.99',
  );
  assert.equal(formatAmount('0.01', 'USD'), 'US$ 0.01');
});
test('accounts reject imprecise and unsupported financial inputs', () => {
  const valid = {
    name: ' Cuenta ',
    type: 'BANK',
    currency: 'PEN',
    openingBalance: '120.50',
  };
  assert.equal(newAccountSchema.parse(valid).name, 'Cuenta');
  for (const openingBalance of [
    '-1',
    '1e3',
    '1.001',
    '1,50',
    '10000000000000000',
    120.5,
  ])
    assert.equal(
      newAccountSchema.safeParse({ ...valid, openingBalance }).success,
      false,
    );
  assert.equal(
    newAccountSchema.safeParse({ ...valid, currency: 'EUR' }).success,
    false,
  );
  assert.equal(
    newAccountSchema.safeParse({ ...valid, name: '  ' }).success,
    false,
  );
});
test('account maintenance keeps currency outside editable fields', () => {
  const changes = {
    name: ' Cuenta diaria ',
    type: 'CASH',
    openingBalance: '25.50',
  };
  assert.equal(accountChangesSchema.parse(changes).name, 'Cuenta diaria');
  assert.equal(
    accountChangesSchema.safeParse({ ...changes, openingBalance: '-1' })
      .success,
    false,
  );
});
test('registration enforces valid email and bounded password length', () => {
  assert.equal(
    credentialsSchema.safeParse({
      email: 'person@example.com',
      password: 'a'.repeat(12),
    }).success,
    true,
  );
  for (const password of ['short', 'a'.repeat(129)])
    assert.equal(
      credentialsSchema.safeParse({ email: 'person@example.com', password })
        .success,
      false,
    );
  assert.equal(
    credentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'a'.repeat(12),
    }).success,
    false,
  );
});
