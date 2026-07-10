import { describe, expect, it } from 'vitest';
import { checkDefermentRule } from './deferments';
import type { Deferment } from './types';

const existing: Deferment[] = [
  { id: 'def-feb27', targetItemId: 'loan-emi', month: '2027-02', fee: 105, status: 'planned' },
  { id: 'def-apr27', targetItemId: 'loan-emi', month: '2027-04', fee: 105, status: 'planned' },
];

describe('checkDefermentRule', () => {
  it('allows the seed plan deferments themselves (2 months apart, within the same year)', () => {
    // Apr-27 checked against only the Feb-27 deferment already existing.
    expect(checkDefermentRule({ targetItemId: 'loan-emi', month: '2027-04' }, [existing[0]!])).toBeNull();
  });

  it('rejects a deferment adjacent to an existing one for the same loan', () => {
    const result = checkDefermentRule({ targetItemId: 'loan-emi', month: '2027-03' }, existing);
    expect(result).toMatch(/adjacent/);
  });

  it('rejects a 3rd deferment within the rolling 12-month window', () => {
    const result = checkDefermentRule({ targetItemId: 'loan-emi', month: '2027-06' }, existing);
    expect(result).toMatch(/max 2 per loan cycle year/);
  });

  it('allows a deferment outside the 12-month window', () => {
    expect(checkDefermentRule({ targetItemId: 'loan-emi', month: '2028-06' }, existing)).toBeNull();
  });

  it('ignores deferments for a different loan entirely', () => {
    const otherLoan: Deferment[] = [
      { id: 'x', targetItemId: 'other-loan', month: '2027-03', fee: 105, status: 'planned' },
    ];
    expect(checkDefermentRule({ targetItemId: 'loan-emi', month: '2027-03' }, otherLoan)).toBeNull();
  });
});
