import { breakdownForMonth } from './cashflow';
import type { Deferment, Month, OneTimeEvent, RecurringItem } from './types';

export interface ExpenseLike {
  amount: number;
}

/**
 * Actual net cash flow for a month, once it's over. Income and loan EMI are
 * taken as planned (there's no separate "income actually received" log);
 * one-time events only count if status is "done" (a "planned" rent cheque
 * hasn't necessarily cleared yet); fixed costs are replaced by real logged
 * expenses, since that's the whole point of closing a month.
 */
export function actualNetCashFlowForMonth(
  month: Month,
  recurringItems: RecurringItem[],
  events: OneTimeEvent[],
  deferments: Deferment[],
  expenses: ExpenseLike[],
): number {
  const { income, loanEmi, defermentFees } = breakdownForMonth(month, recurringItems, [], deferments);

  const doneEventsTotal = events
    .filter((e) => e.month === month && e.status === 'done')
    .reduce((sum, e) => sum + e.amount, 0);

  const actualExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return income + loanEmi + defermentFees + doneEventsTotal - actualExpenseTotal;
}
