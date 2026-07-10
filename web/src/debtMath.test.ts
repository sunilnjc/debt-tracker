import { describe, expect, it } from 'vitest';
import { overallPaidOffPercent, toAed } from './debtMath';
import type { Debt } from './types';

const shruthi: Debt = {
  id: 'shruthi', creditor: 'Shruthi', originalAmount: 20000, currentBalance: 20000,
  priority: 1, currency: 'AED', fxRate: null,
};
const arun: Debt = {
  id: 'arun', creditor: 'Arun', originalAmount: 300000, currentBalance: 300000,
  priority: 4, currency: 'INR', fxRate: 22.2222,
};

describe('toAed', () => {
  it('passes AED amounts through unchanged', () => {
    expect(toAed(20000, shruthi)).toBe(20000);
  });

  it('converts INR using the fxRate', () => {
    expect(toAed(300000, arun)).toBeCloseTo(13500, 0);
  });
});

describe('overallPaidOffPercent', () => {
  it('is 0% at the start of the plan (matches the financial plan totals)', () => {
    expect(overallPaidOffPercent([shruthi, arun])).toBe(0);
  });

  it('is 100 when every debt is cleared', () => {
    const cleared = [{ ...shruthi, currentBalance: 0 }, { ...arun, currentBalance: 0 }];
    expect(overallPaidOffPercent(cleared)).toBe(100);
  });

  it('computes a partial percentage across mixed currencies', () => {
    const partial = [{ ...shruthi, currentBalance: 10000 }, { ...arun, currentBalance: 0 }];
    // original: 20000 + 13500 = 33500; current: 10000; paid: 23500 -> 70%
    expect(overallPaidOffPercent(partial)).toBe(70);
  });

  it('returns 100 for an empty debt list', () => {
    expect(overallPaidOffPercent([])).toBe(100);
  });
});
