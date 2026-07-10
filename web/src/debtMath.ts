import type { Debt } from './types';

export function toAed(amount: number, debt: Pick<Debt, 'currency' | 'fxRate'>): number {
  if (debt.currency === 'AED' || !debt.fxRate) return amount;
  return amount / debt.fxRate;
}

/** Percentage of total original debt (AED-normalized) paid off across all debts. */
export function overallPaidOffPercent(debts: Debt[]): number {
  const originalTotal = debts.reduce((sum, d) => sum + toAed(d.originalAmount, d), 0);
  const currentTotal = debts.reduce((sum, d) => sum + toAed(d.currentBalance, d), 0);
  if (originalTotal <= 0) return 100;
  return Math.round(((originalTotal - currentTotal) / originalTotal) * 100);
}
