import { compareMonths } from './month';
import type { Deferment, Month, OneTimeEvent, RecurringItem } from './types';

export interface MonthBreakdown {
  month: Month;
  income: number;
  loanEmi: number;
  fixedCosts: number;
  oneTime: number;
  rentCheques: number;
  defermentFees: number;
  net: number;
}

export function isActive(item: RecurringItem, month: Month): boolean {
  return (
    compareMonths(item.startMonth, month) <= 0 &&
    (item.endMonth === null || compareMonths(month, item.endMonth) <= 0)
  );
}

/**
 * Cash flow for one month: recurring items (with deferments zeroing their
 * target and charging the fee) plus one-time events.
 *
 * Note: the plan's hand-built tables omit the 105 AED deferment fee; the
 * engine charges it, so deferment months come out 105 lower than the plan.
 */
export function breakdownForMonth(
  month: Month,
  items: RecurringItem[],
  events: OneTimeEvent[],
  deferments: Deferment[],
): MonthBreakdown {
  const activeDeferments = deferments.filter((d) => d.month === month);
  const deferredItemIds = new Set(activeDeferments.map((d) => d.targetItemId));

  let income = 0;
  let loanEmi = 0;
  let fixedCosts = 0;
  for (const item of items) {
    if (!isActive(item, month)) continue;
    const amount = deferredItemIds.has(item.id) ? 0 : item.amount;
    if (item.category === 'income') income += amount;
    else if (item.category === 'loan_emi') loanEmi += amount;
    else fixedCosts += amount;
  }

  const defermentFees = activeDeferments.reduce((sum, d) => sum - d.fee, 0);

  let oneTime = 0;
  let rentCheques = 0;
  for (const event of events) {
    if (event.month !== month || event.status === 'cancelled') continue;
    if (event.kind === 'rent_cheque') rentCheques += event.amount;
    else oneTime += event.amount;
  }

  return {
    month,
    income,
    loanEmi,
    fixedCosts,
    oneTime,
    rentCheques,
    defermentFees,
    net: income + loanEmi + fixedCosts + oneTime + rentCheques + defermentFees,
  };
}
