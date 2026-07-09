/**
 * Acceptance tests: the engine must reproduce the financial plan
 * (docs/FINANCIAL-PLAN-2026.md §6 cash flow and §7 payoff schedule).
 *
 * One deliberate divergence: the plan's tables omit the 105 AED deferment fee;
 * the engine charges it. Deferment months are therefore 105 lower than the
 * plan (Feb-27: 11,705 vs 11,810 · Apr-27: 23,205 vs 23,310).
 */
import { describe, expect, it } from 'vitest';
import { PLAN_START, seedPlan } from './seed-data';
import { project } from './project';
import type { PlanInput } from './types';

const projection = project(seedPlan, PLAN_START, 12);
const byMonth = Object.fromEntries(projection.months.map((m) => [m.month, m]));

describe('plan §6 — monthly net cash flow', () => {
  const expected: Array<[string, number]> = [
    ['2026-07', 4108],
    ['2026-08', 3890],
    ['2026-09', 7890],
    ['2026-10', 7890],
    ['2026-11', -3610],
    ['2026-12', 7890],
    ['2027-01', 7890],
    ['2027-02', 11705], // plan says 11,810; engine charges the 105 deferment fee
    ['2027-03', 7890],
    ['2027-04', 23205], // plan says 23,310; same fee
    ['2027-05', -3610],
    ['2027-06', 7890],
  ];

  it.each(expected)('%s nets %d', (month, net) => {
    expect(byMonth[month]?.netCashFlow).toBe(net);
  });
});

describe('plan §7 — debt payoff schedule', () => {
  it('starts from 53,500 AED total debt', () => {
    expect(projection.summary.totalDebtAed).toBe(53500);
  });

  it('clears each creditor in the plan month', () => {
    expect(projection.summary.clearMonthByDebt).toEqual({
      shruthi: '2026-10',
      bhagya: '2026-12',
      paul: '2026-12',
      arun: '2027-02',
      'credit-card': '2027-03',
    });
  });

  it('is debt-free in March 2027', () => {
    expect(projection.debtFreeMonth).toBe('2027-03');
  });

  it('splits Oct-26 across Shruthi and Bhagya', () => {
    expect(byMonth['2026-10']?.debtPayments).toEqual([
      { debtId: 'shruthi', amount: 4112 },
      { debtId: 'bhagya', amount: 3778 },
    ]);
  });

  it('pays three creditors in Dec-26', () => {
    expect(byMonth['2026-12']?.debtPayments).toEqual([
      { debtId: 'bhagya', amount: 1222 },
      { debtId: 'paul', amount: 5000 },
      { debtId: 'arun', amount: 1668 },
    ]);
  });

  it('pauses debt payments in rent-cheque deficit months', () => {
    expect(byMonth['2026-11']?.debtPayments).toEqual([]);
    expect(byMonth['2026-11']?.flags.rentChequeMonth).toBe(true);
  });
});

describe('deferments', () => {
  it('zeroes the EMI and charges the fee in deferment months', () => {
    for (const month of ['2027-02', '2027-04']) {
      expect(byMonth[month]?.loanEmi).toBe(0);
      expect(byMonth[month]?.defermentFees).toBe(-105);
      expect(byMonth[month]?.flags.defermentMonth).toBe(true);
    }
  });

  it('charges the full EMI in normal months', () => {
    expect(byMonth['2027-01']?.loanEmi).toBe(-15420);
    expect(byMonth['2027-01']?.defermentFees).toBe(0);
  });
});

describe('edge cases', () => {
  it('reports no debt-free month when the horizon is too short', () => {
    expect(project(seedPlan, PLAN_START, 3).debtFreeMonth).toBeNull();
  });

  it('is immediately debt-free with no debts', () => {
    const noDebts: PlanInput = { ...seedPlan, debts: [] };
    expect(project(noDebts, PLAN_START, 1).debtFreeMonth).toBe(PLAN_START);
  });

  it('ignores cancelled one-time events', () => {
    const cancelled: PlanInput = {
      ...seedPlan,
      oneTimeEvents: seedPlan.oneTimeEvents.map((e) =>
        e.id === 'tabby-final' ? { ...e, status: 'cancelled' as const } : e,
      ),
    };
    expect(project(cancelled, PLAN_START, 1).months[0]?.netCashFlow).toBe(4108 + 3782);
  });

  it('moves the debt-free date earlier on a salary hike (the payoff moment)', () => {
    const hiked: PlanInput = {
      ...seedPlan,
      recurringItems: seedPlan.recurringItems.map((i) =>
        i.id === 'salary' ? { ...i, amount: 40000 } : i,
      ),
    };
    const result = project(hiked, PLAN_START, 12);
    expect(result.debtFreeMonth).not.toBeNull();
    expect(result.debtFreeMonth! < '2027-03').toBe(true);
  });
});
