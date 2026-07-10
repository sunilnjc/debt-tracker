import { describe, expect, it } from 'vitest';
import { summarizeBudgetVsActual } from './budget';
import type { RecurringItem } from './types';

const grocery: RecurringItem = {
  id: 'grocery', name: 'Grocery', amount: -600, category: 'fixed_cost',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};
const petrol: RecurringItem = {
  id: 'petrol', name: 'Petrol', amount: -300, category: 'fixed_cost',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};
const salary: RecurringItem = {
  id: 'salary', name: 'Salary', amount: 32000, category: 'income',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};

describe('summarizeBudgetVsActual', () => {
  it('matches a hand-built fixture month: over on grocery, under on petrol', () => {
    const expenses = [
      { category: 'grocery', amount: 250 },
      { category: 'grocery', amount: 400 },
      { category: 'petrol', amount: 120 },
    ];
    const result = summarizeBudgetVsActual(expenses, [grocery, petrol, salary], '2026-07');

    expect(result).toEqual([
      { category: 'grocery', budgeted: 600, actual: 650 },
      { category: 'petrol', budgeted: 300, actual: 120 },
    ]);
  });

  it('excludes income/loan_emi recurring items from budgeted categories', () => {
    const result = summarizeBudgetVsActual([], [salary], '2026-07');
    expect(result).toEqual([]);
  });

  it('includes an "other" category with no budget row when logged', () => {
    const result = summarizeBudgetVsActual([{ category: 'other', amount: 50 }], [grocery], '2026-07');
    expect(result).toEqual([
      { category: 'grocery', budgeted: 600, actual: 0 },
      { category: 'other', budgeted: 0, actual: 50 },
    ]);
  });

  it('excludes recurring items not active in the given month', () => {
    const futureItem: RecurringItem = { ...grocery, startMonth: '2026-09' };
    const result = summarizeBudgetVsActual([], [futureItem], '2026-07');
    expect(result).toEqual([]);
  });

  it('returns an empty array for a quiet month with no data', () => {
    expect(summarizeBudgetVsActual([], [], '2026-07')).toEqual([]);
  });
});
