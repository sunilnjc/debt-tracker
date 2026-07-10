import { describe, expect, it } from 'vitest';
import { forecastSavings, type SavingsTarget } from './savings';
import type { MonthProjection } from './types';

// Minimal month fixtures — only `month` and `buffer` matter to forecastSavings.
function m(month: string, buffer: number): MonthProjection {
  return {
    month,
    income: 0, loanEmi: 0, fixedCosts: 0, oneTime: 0, rentCheques: 0, defermentFees: 0,
    netCashFlow: 0, debtPayments: [], debtBalancesAed: {}, buffer,
    flags: { rentChequeMonth: false, defermentMonth: false, debtsCleared: [] },
  };
}

const targets: SavingsTarget[] = [
  { id: 'a', label: 'A', amount: 5000 },
  { id: 'b', label: 'B', amount: 15000 },
  { id: 'c', label: 'C', amount: 72000 },
];

describe('forecastSavings', () => {
  const months = [
    m('2027-03', 2043),
    m('2027-04', 25248),
    m('2027-05', 21638),
    m('2027-06', 29528),
  ];

  it('reports the first month each target buffer is reached', () => {
    const { entries } = forecastSavings(months, targets);
    expect(entries[0]!.achievedMonth).toBe('2027-04'); // 5,000 first crossed at the Apr windfall
    expect(entries[1]!.achievedMonth).toBe('2027-04'); // 15,000 too
    expect(entries[2]!.achievedMonth).toBeNull(); // 72,000 not within horizon
  });

  it('reports the final buffer at the end of the horizon', () => {
    expect(forecastSavings(months, targets).finalBuffer).toBe(29528);
  });

  it('does not treat a temporary dip as reaching a higher target', () => {
    // Buffer reaches 5,000 in the first month and never dips below.
    const rising = [m('2027-01', 6000), m('2027-02', 4000), m('2027-03', 16000)];
    const { entries } = forecastSavings(rising, targets);
    expect(entries[0]!.achievedMonth).toBe('2027-01');
    expect(entries[1]!.achievedMonth).toBe('2027-03');
  });

  it('handles an empty projection', () => {
    const { entries, finalBuffer } = forecastSavings([], targets);
    expect(finalBuffer).toBe(0);
    expect(entries.every((e) => e.achievedMonth === null)).toBe(true);
  });
});
