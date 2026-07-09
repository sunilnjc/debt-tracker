import { describe, expect, it } from 'vitest';
import { allocate, debtBalanceAed } from './waterfall';
import type { Debt } from './types';

const order = ['a', 'b', 'c'];

describe('allocate', () => {
  it('pays the highest-priority debt first', () => {
    const result = allocate(1000, { a: 5000, b: 5000, c: 5000 }, order);
    expect(result.payments).toEqual([{ debtId: 'a', amount: 1000 }]);
    expect(result.balances).toEqual({ a: 4000, b: 5000, c: 5000 });
    expect(result.leftover).toBe(0);
  });

  it('cascades overflow to the next priority (the Oct-26 case)', () => {
    // 7,890 surplus: Shruthi's last 4,112, then 3,778 to Bhagya.
    const result = allocate(7890, { a: 4112, b: 5000, c: 5000 }, order);
    expect(result.payments).toEqual([
      { debtId: 'a', amount: 4112 },
      { debtId: 'b', amount: 3778 },
    ]);
    expect(result.balances).toEqual({ a: 0, b: 1222, c: 5000 });
  });

  it('skips already-cleared debts', () => {
    const result = allocate(100, { a: 0, b: 50, c: 500 }, order);
    expect(result.payments).toEqual([
      { debtId: 'b', amount: 50 },
      { debtId: 'c', amount: 50 },
    ]);
  });

  it('pays nothing on zero or negative surplus', () => {
    expect(allocate(0, { a: 100 }, ['a']).payments).toEqual([]);
    expect(allocate(-3610, { a: 100 }, ['a']).payments).toEqual([]);
  });

  it('returns leftover once all debts are cleared', () => {
    const result = allocate(1000, { a: 300 }, ['a']);
    expect(result.leftover).toBe(700);
    expect(result.balances).toEqual({ a: 0 });
  });
});

describe('debtBalanceAed', () => {
  const base: Debt = {
    id: 'x', creditor: 'X', originalAmount: 0, currentBalance: 0,
    priority: 1, currency: 'AED', fxRate: null,
  };

  it('passes AED balances through', () => {
    expect(debtBalanceAed({ ...base, currentBalance: 10000 })).toBe(10000);
  });

  it('converts INR at the stored rate (Arun = 13,500 AED)', () => {
    expect(
      debtBalanceAed({ ...base, currentBalance: 300000, currency: 'INR', fxRate: 22.2222 }),
    ).toBe(13500);
  });

  it('throws on foreign currency without a rate', () => {
    expect(() => debtBalanceAed({ ...base, currency: 'INR', fxRate: null })).toThrow(/fxRate/);
  });
});
