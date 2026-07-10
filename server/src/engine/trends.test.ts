import { describe, expect, it } from 'vitest';
import { spendingTrends, type TrendExpense } from './trends';

const expenses: TrendExpense[] = [
  { category: 'grocery', amount: 250, date: '2026-07-05' },
  { category: 'grocery', amount: 400, date: '2026-07-20' },
  { category: 'grocery', amount: 300, date: '2026-08-10' },
  { category: 'petrol', amount: 120, date: '2026-07-10' },
  { category: 'petrol', amount: 150, date: '2026-09-01' },
];

describe('spendingTrends', () => {
  it('builds a category × month grid over the range', () => {
    const result = spendingTrends(expenses, '2026-07', '2026-09');
    expect(result.months).toEqual(['2026-07', '2026-08', '2026-09']);

    const grocery = result.categories.find((c) => c.category === 'grocery')!;
    expect(grocery.totals).toEqual([650, 300, 0]);
    expect(grocery.total).toBe(950);

    const petrol = result.categories.find((c) => c.category === 'petrol')!;
    expect(petrol.totals).toEqual([120, 0, 150]);
    expect(petrol.total).toBe(270);
  });

  it('sorts categories alphabetically', () => {
    const result = spendingTrends(expenses, '2026-07', '2026-09');
    expect(result.categories.map((c) => c.category)).toEqual(['grocery', 'petrol']);
  });

  it('excludes expenses outside the range', () => {
    const result = spendingTrends(expenses, '2026-08', '2026-08');
    expect(result.months).toEqual(['2026-08']);
    expect(result.categories).toEqual([
      { category: 'grocery', totals: [300], total: 300 },
    ]);
  });

  it('returns no categories for a range with no expenses', () => {
    const result = spendingTrends(expenses, '2027-01', '2027-02');
    expect(result.months).toEqual(['2027-01', '2027-02']);
    expect(result.categories).toEqual([]);
  });
});
