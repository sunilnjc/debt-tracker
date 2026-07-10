import { addMonths, compareMonths } from './month';
import type { Month } from './types';

export interface TrendExpense {
  category: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
}

export interface CategoryTrend {
  category: string;
  /** Total per month, aligned to the `months` array order. */
  totals: number[];
  /** Sum across the whole range. */
  total: number;
}

export interface SpendingTrends {
  months: Month[];
  categories: CategoryTrend[];
}

function monthsInRange(from: Month, to: Month): Month[] {
  const result: Month[] = [];
  for (let m = from; compareMonths(m, to) <= 0; m = addMonths(m, 1)) {
    result.push(m);
    if (result.length > 120) break; // guard against a reversed/huge range
  }
  return result;
}

/**
 * Per-category spending totals across a month range (categories = rows,
 * months = columns). Pure — the route feeds it already-loaded expenses.
 */
export function spendingTrends(expenses: TrendExpense[], from: Month, to: Month): SpendingTrends {
  const months = monthsInRange(from, to);
  const monthIndex = new Map(months.map((m, i) => [m, i]));

  const byCategory = new Map<string, number[]>();
  for (const expense of expenses) {
    const month = expense.date.slice(0, 7);
    const col = monthIndex.get(month);
    if (col === undefined) continue; // outside the range
    let row = byCategory.get(expense.category);
    if (!row) {
      row = months.map(() => 0);
      byCategory.set(expense.category, row);
    }
    row[col] = (row[col] ?? 0) + expense.amount;
  }

  const categories: CategoryTrend[] = [...byCategory.entries()]
    .map(([category, totals]) => ({
      category,
      totals,
      total: totals.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return { months, categories };
}
