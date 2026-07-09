import type { Debt, DebtPayment } from './types';

/** Balance in AED, rounded to whole dirhams. */
export function debtBalanceAed(debt: Debt): number {
  if (debt.currency === 'AED') return debt.currentBalance;
  if (!debt.fxRate || debt.fxRate <= 0) {
    throw new Error(`Debt ${debt.id} is in ${debt.currency} but has no fxRate`);
  }
  return Math.round(debt.currentBalance / debt.fxRate);
}

export interface WaterfallResult {
  payments: DebtPayment[];
  /** Balances after payments, keyed by debt id. */
  balances: Record<string, number>;
  /** Surplus left after every debt is cleared. */
  leftover: number;
}

/**
 * Allocate a month's surplus to debts in priority order (1 first).
 * Overflow cascades to the next debt; anything beyond the last debt is leftover.
 * Zero or negative surplus pays nothing.
 */
export function allocate(
  surplus: number,
  balancesAed: Record<string, number>,
  priorityOrder: string[],
): WaterfallResult {
  const balances = { ...balancesAed };
  const payments: DebtPayment[] = [];
  let remaining = Math.max(0, surplus);

  for (const debtId of priorityOrder) {
    if (remaining <= 0) break;
    const balance = balances[debtId] ?? 0;
    if (balance <= 0) continue;
    const amount = Math.min(remaining, balance);
    payments.push({ debtId, amount });
    balances[debtId] = balance - amount;
    remaining -= amount;
  }

  return { payments, balances, leftover: remaining };
}
