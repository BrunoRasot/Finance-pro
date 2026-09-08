import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contributionInputSchema,
  goalInputSchema,
  goalUpdateSchema,
} from '../src/features/goals/model.ts';

test('validates savings goals without accepting imprecise targets', () => {
  assert.equal(
    goalInputSchema.safeParse({
      name: 'Emergencias',
      currency: 'PEN',
      targetAmount: '5000.00',
      deadline: '',
    }).success,
    true,
  );
  assert.equal(
    goalInputSchema.safeParse({
      name: '',
      currency: 'PEN',
      targetAmount: '0.00',
      deadline: '2026-02-30',
    }).success,
    false,
  );
});

test('goal updates cannot change currency and contributions require retry keys', () => {
  assert.equal(
    goalUpdateSchema.safeParse({
      id: 'eb496c3c-bae9-4a45-b6cd-01898f02b4ed',
      name: 'Viaje',
      targetAmount: '1200.00',
      deadline: '2027-01-01',
      currency: 'USD',
    }).success,
    false,
  );
  assert.equal(
    contributionInputSchema.safeParse({
      goalId: 'eb496c3c-bae9-4a45-b6cd-01898f02b4ed',
      amount: '20.00',
      date: '2026-09-05',
      note: '',
      idempotencyKey: 'not-a-uuid',
    }).success,
    false,
  );
});
