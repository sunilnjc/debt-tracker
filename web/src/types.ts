/** Mirrors server/src/engine/types.ts — the subset the UI needs. */

export type Month = string;

export interface DebtPayment {
  debtId: string;
  amount: number;
}

export interface MonthFlags {
  rentChequeMonth: boolean;
  defermentMonth: boolean;
  debtsCleared: string[];
}

export interface MonthProjection {
  month: Month;
  income: number;
  loanEmi: number;
  fixedCosts: number;
  oneTime: number;
  rentCheques: number;
  defermentFees: number;
  netCashFlow: number;
  debtPayments: DebtPayment[];
  debtBalancesAed: Record<string, number>;
  buffer: number;
  flags: MonthFlags;
}

export interface ProjectionSummary {
  totalDebtAed: number;
  clearMonthByDebt: Record<string, Month>;
}

export interface Projection {
  months: MonthProjection[];
  debtFreeMonth: Month | null;
  summary: ProjectionSummary;
}

export type RecurringCategory = 'income' | 'loan_emi' | 'fixed_cost';

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  category: RecurringCategory;
  frequency: 'monthly';
  startMonth: Month;
  endMonth: Month | null;
  notes?: string;
}

export type Currency = 'AED' | 'INR';

export interface Debt {
  id: string;
  creditor: string;
  originalAmount: number;
  currentBalance: number;
  priority: number;
  currency: Currency;
  fxRate: number | null;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
}

export interface CategorySummary {
  category: string;
  budgeted: number;
  actual: number;
}
