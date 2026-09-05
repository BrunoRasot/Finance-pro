import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  monthSchema,
  currentMonth,
  categoryPercent,
  monthTitle,
} from '../src/features/reports/model.ts';
test('monthly selection validates calendar bounds', () => {
  for (const value of [
    '0000-01',
    '2026-00',
    '2026-13',
    '2026-1',
    '2026-01-01',
    ['2026-01'],
  ])
    assert.equal(monthSchema.safeParse(value).success, false);
  assert.equal(monthSchema.parse('2028-02'), '2028-02');
  assert.equal(monthTitle('2028-02'), 'Febrero de 2028');
});
test('default month follows Lima at a UTC month boundary', () => {
  assert.equal(currentMonth(new Date('2026-10-01T02:00:00Z')), '2026-09');
  assert.equal(currentMonth(new Date('2026-10-01T05:00:00Z')), '2026-10');
});
test('category chart ratios preserve large monetary values', () => {
  assert.equal(
    categoryPercent('9999999999999999.99', '19999999999999999.98'),
    50,
  );
  assert.equal(categoryPercent('0.01', '0.03'), 33.33);
  assert.equal(categoryPercent('0.00', '0.00'), 0);
});
