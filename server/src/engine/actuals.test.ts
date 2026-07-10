import { describe, expect, it } from 'vitest';
import { actualNetCashFlowForMonth } from './actuals';
import type { Deferment, OneTimeEvent, RecurringItem } from './types';

const salary: RecurringItem = {
  id: 'salary', name: 'Salary', amount: 32000, category: 'income',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};
const loanEmi: RecurringItem = {
  id: 'loan-emi', name: 'Loan EMI', amount: -15420, category: 'loan_emi',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};
const grocery: RecurringItem = {
  id: 'grocery', name: 'Grocery', amount: -600, category: 'fixed_cost',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};

describe('actualNetCashFlowForMonth', () => {
  it('replaces budgeted fixed costs with real logged expenses', () => {
    const result = actualNetCashFlowForMonth(
      '2026-07', [salary, loanEmi, grocery], [], [], [{ amount: 650 }, { amount: 120 }],
    );
    // 32000 - 15420 - 770 (actual expenses, budgeted fixed costs ignored)
    expect(result).toBe(32000 - 15420 - 770);
  });

  it('counts only "done" one-time events, not "planned" ones', () => {
    const events: OneTimeEvent[] = [
      { id: 'a', name: 'Done rent', amount: -11500, month: '2026-07', kind: 'rent_cheque', status: 'done' },
      { id: 'b', name: 'Planned tabby', amount: -3782, month: '2026-07', kind: 'other', status: 'planned' },
    ];
    const result = actualNetCashFlowForMonth('2026-07', [salary], events, [], []);
    expect(result).toBe(32000 - 11500);
  });

  it('zeroes the EMI and charges the fee in a deferment month', () => {
    const deferments: Deferment[] = [{ id: 'd', targetItemId: 'loan-emi', month: '2027-02', fee: 105, status: 'used' }];
    const result = actualNetCashFlowForMonth('2027-02', [salary, loanEmi], [], deferments, []);
    expect(result).toBe(32000 - 105);
  });

  it('ignores done events from other months (expenses are assumed pre-filtered by the caller)', () => {
    const events: OneTimeEvent[] = [
      { id: 'a', name: 'August thing', amount: -1000, month: '2026-08', kind: 'other', status: 'done' },
    ];
    const result = actualNetCashFlowForMonth('2026-07', [salary], events, [], [{ amount: 100 }]);
    expect(result).toBe(32000 - 100);
  });
});
