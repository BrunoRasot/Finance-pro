import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  transactionInputSchema,
  transactionChangesSchema,
  filtersSchema,
  historyQuery,
  displayDate,
} from '../src/features/transactions/model.ts';
import { formatAmount } from '../src/lib/validation.ts';
const valid = {
  type: 'EXPENSE',
  category: 'FOOD',
  amount: '0.01',
  date: '2026-09-03',
  description: ' Almuerzo ',
  idempotencyKey: 'be5a4d2d-1c3f-4e67-b2b1-0a60f630ad16',
};
test('validates movement amounts without floating point conversion', () => {
  assert.equal(transactionInputSchema.parse(valid).description, 'Almuerzo');
  assert.equal(
    transactionInputSchema.parse({ ...valid, amount: '9999999999999999.99' })
      .amount,
    '9999999999999999.99',
  );
  for (const amount of [
    '0',
    '0.00',
    '-1',
    '1e2',
    '1,50',
    '0.001',
    1.5,
    '10000000000000000',
  ])
    assert.equal(
      transactionInputSchema.safeParse({ ...valid, amount }).success,
      false,
    );
});
test('enforces actual calendar dates, matching categories and retry keys', () => {
  for (const override of [
    { date: '2026-02-29' },
    { date: '2026-02-30' },
    { date: '0000-01-01' },
    { date: '2026-09-03T00:00:00Z' },
    { category: 'SALARY' },
    { idempotencyKey: 'invalid' },
  ])
    assert.equal(
      transactionInputSchema.safeParse({ ...valid, ...override }).success,
      false,
    );
  assert.equal(
    transactionInputSchema.safeParse({
      ...valid,
      date: '2028-02-29',
      category: 'OTHER',
    }).success,
    true,
  );
});
test('validates editable movement fields without requiring a retry key', () => {
  const changes = {
    type: valid.type,
    category: valid.category,
    amount: valid.amount,
    date: valid.date,
    description: valid.description,
  };
  assert.equal(transactionChangesSchema.parse(changes).description, 'Almuerzo');
  assert.equal(
    transactionChangesSchema.safeParse({ ...changes, category: 'SALARY' })
      .success,
    false,
  );
});
test('history pagination preserves filters and stays within backend bounds', () => {
  const filters = filtersSchema.parse({
    type: 'EXPENSE',
    category: 'FOOD',
    from: '2026-09-01',
    to: '2026-09-30',
    page: '2',
  });
  const query = new URLSearchParams(historyQuery(filters, 3));
  assert.equal(query.get('page'), '3');
  assert.equal(query.get('category'), 'FOOD');
  assert.equal(query.get('from'), '2026-09-01');
  for (const value of [
    { page: 502 },
    { page: 0 },
    { page: 1.5 },
    { from: '2026-10-01', to: '2026-09-01' },
    { from: '2026-02-30' },
  ])
    assert.equal(filtersSchema.safeParse(value).success, false);
});
test('negative cents retain their sign and dates never shift with timezone', () => {
  assert.equal(formatAmount('-0.01', 'PEN'), 'S/ -0.01');
  assert.equal(
    formatAmount('-10000000000000000.01', 'USD'),
    'US$ -10,000,000,000,000,000.01',
  );
  assert.equal(displayDate('2026-09-03'), '03/09/2026');
});
