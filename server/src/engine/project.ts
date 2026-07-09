import { breakdownForMonth } from './cashflow';
import { monthRange } from './month';
import type { Month, MonthProjection, PlanInput, Projection } from './types';
import { allocate, debtBalanceAed } from './waterfall';

/**
 * Project cash flow and debt payoff over a horizon starting at `startMonth`.
 *
 * Waterfall rules (per docs/SPEC.md §4):
 * - Positive net cash flow goes to debts in priority order; overflow cascades.
 * - Non-positive months (rent cheques) pay no debt; the deficit hits the buffer.
 * - Once all debts are cleared, surplus accumulates in the buffer.
 */
export function project(input: PlanInput, startMonth: Month, horizonMonths: number): Projection {
  const priorityOrder = [...input.debts]
    .sort((a, b) => a.priority - b.priority)
    .map((d) => d.id);

  let balances: Record<string, number> = {};
  for (const debt of input.debts) balances[debt.id] = debtBalanceAed(debt);
  const totalDebtAed = Object.values(balances).reduce((a, b) => a + b, 0);

  const months: MonthProjection[] = [];
  const clearMonthByDebt: Record<string, Month> = {};
  let debtFreeMonth: Month | null = totalDebtAed === 0 ? startMonth : null;
  let buffer = 0;

  for (const month of monthRange(startMonth, horizonMonths)) {
    const flow = breakdownForMonth(month, input.recurringItems, input.oneTimeEvents, input.deferments);

    const { payments, balances: nextBalances, leftover } =
      flow.net > 0
        ? allocate(flow.net, balances, priorityOrder)
        : { payments: [], balances, leftover: 0 };

    const debtsCleared = priorityOrder.filter(
      (id) => (balances[id] ?? 0) > 0 && (nextBalances[id] ?? 0) === 0,
    );
    for (const id of debtsCleared) clearMonthByDebt[id] = month;

    // Non-positive months drain the buffer; positive months only keep what the
    // waterfall did not consume.
    buffer += flow.net > 0 ? leftover : flow.net;
    balances = nextBalances;

    const allCleared = priorityOrder.every((id) => (balances[id] ?? 0) === 0);
    if (allCleared && debtFreeMonth === null) debtFreeMonth = month;

    months.push({
      month,
      income: flow.income,
      loanEmi: flow.loanEmi,
      fixedCosts: flow.fixedCosts,
      oneTime: flow.oneTime,
      rentCheques: flow.rentCheques,
      defermentFees: flow.defermentFees,
      netCashFlow: flow.net,
      debtPayments: payments,
      debtBalancesAed: { ...balances },
      buffer,
      flags: {
        rentChequeMonth: flow.rentCheques !== 0,
        defermentMonth: flow.defermentFees !== 0,
        debtsCleared,
      },
    });
  }

  return { months, debtFreeMonth, summary: { totalDebtAed, clearMonthByDebt } };
}
