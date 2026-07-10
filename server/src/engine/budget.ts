import { isActive } from './cashflow';
import type { Month, RecurringItem } from './types';

export interface CategorySummary {
  category: string;
  budgeted: number;
  actual: number;
}

export interface ExpenseLike {
  category: string;
  amount: number;
}

/**
 * Budgeted (fixed-cost RecurringItems active that month, as positive amounts)
 * vs. actual (logged expenses), grouped by category. Categories are just
 * RecurringItem ids by convention — no separate category table to keep in sync.
 */
export function summarizeBudgetVsActual(
  expenses: ExpenseLike[],
  recurringItems: RecurringItem[],
  month: Month,
): CategorySummary[] {
  const actualByCategory = new Map<string, number>();
  for (const expense of expenses) {
    actualByCategory.set(expense.category, (actualByCategory.get(expense.category) ?? 0) + expense.amount);
  }

  const budgetedByCategory = new Map<string, number>();
  for (const item of recurringItems) {
    if (item.category === 'fixed_cost' && isActive(item, month)) {
      budgetedByCategory.set(item.id, Math.abs(item.amount));
    }
  }

  const categories = new Set([...actualByCategory.keys(), ...budgetedByCategory.keys()]);
  return [...categories]
    .map((category) => ({
      category,
      budgeted: budgetedByCategory.get(category) ?? 0,
      actual: actualByCategory.get(category) ?? 0,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
