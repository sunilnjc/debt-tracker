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

export interface MonthClose {
  id: string;
  month: Month;
  actualNetCashFlow: number;
  closedAt: string;
}

/** A logged real payment against a debt — distinct from DebtPayment (a projected month's payment). */
export interface DebtPaymentRecord {
  id: string;
  debtId: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
}

export type DefermentStatus = 'planned' | 'confirmed' | 'used';

export interface Deferment {
  id: string;
  targetItemId: string;
  month: Month;
  fee: number;
  status: DefermentStatus;
}

export interface SavingsTarget {
  id: string;
  label: string;
  amount: number;
}

export interface SavingsForecastEntry {
  target: SavingsTarget;
  achievedMonth: Month | null;
}

export interface SavingsForecast {
  entries: SavingsForecastEntry[];
  finalBuffer: number;
  debtFreeMonth: Month | null;
}

export interface CategoryTrend {
  category: string;
  totals: number[];
  total: number;
}

export interface SpendingTrends {
  months: Month[];
  categories: CategoryTrend[];
}
