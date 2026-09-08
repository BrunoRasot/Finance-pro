import assert from 'node:assert/strict';
import test from 'node:test';
import {
  budgetCategorySchema,
  budgetInputSchema,
} from '../src/features/budgets/model.ts';

test('validates monthly expense budgets with exact decimal amounts', () => {
  assert.equal(
    budgetInputSchema.safeParse({
      month: '2026-09',
      currency: 'PEN',
      category: 'FOOD',
      amount: '250.50',
    }).success,
    true,
  );
  for (const amount of ['0.00', '-1.00', '2.999', '1e3'])
    assert.equal(
      budgetInputSchema.safeParse({
        month: '2026-09',
        currency: 'PEN',
        category: 'FOOD',
        amount,
      }).success,
      false,
    );
});

test('budgets accept expense categories and reject income or transfer categories', () => {
  assert.equal(budgetCategorySchema.safeParse('HOUSING').success, true);
  assert.equal(budgetCategorySchema.safeParse('SALARY').success, false);
  assert.equal(budgetCategorySchema.safeParse('TRANSFER').success, false);
});
