import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transferInputSchema } from '../src/features/transfers/model.ts';
import {
  historyCategorySchema,
  transactionInputSchema,
} from '../src/features/transactions/model.ts';

const accountA = '0af2c88e-bb3a-4ca9-a3c7-f55c65d31db8';
const accountB = 'e4c53cb5-93f8-4ee9-af68-68f28e5890e4';
const valid = {
  fromAccountId: accountA,
  toAccountId: accountB,
  amount: '20.50',
  date: '2026-09-05',
  description: ' Ahorro ',
  idempotencyKey: '02e1aca4-05c5-49a0-85e8-c38361203967',
};

test('validates exact transfer input and different accounts', () => {
  assert.equal(transferInputSchema.parse(valid).description, 'Ahorro');
  for (const override of [
    { toAccountId: accountA },
    { amount: '0.00' },
    { amount: 20.5 },
    { date: '2026-02-30' },
    { idempotencyKey: 'invalid' },
  ])
    assert.equal(
      transferInputSchema.safeParse({ ...valid, ...override }).success,
      false,
    );
});

test('transfer category is readable in history but cannot be manually created', () => {
  assert.equal(historyCategorySchema.safeParse('TRANSFER').success, true);
  assert.equal(
    transactionInputSchema.safeParse({
      type: 'EXPENSE',
      category: 'TRANSFER',
      amount: '1.00',
      date: '2026-09-05',
      description: '',
      idempotencyKey: valid.idempotencyKey,
    }).success,
    false,
  );
});
