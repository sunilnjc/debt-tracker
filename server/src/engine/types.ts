/** Calendar month in "YYYY-MM" format. */
export type Month = string;

export type RecurringCategory = 'income' | 'loan_emi' | 'fixed_cost';

export interface RecurringItem {
  id: string;
  name: string;
  /** AED, signed: income positive, costs negative. */
  amount: number;
  category: RecurringCategory;
  frequency: 'monthly';
  startMonth: Month;
  /** null = open-ended. */
  endMonth: Month | null;
  notes?: string;
}

export type OneTimeEventKind = 'rent_cheque' | 'other';
export type OneTimeEventStatus = 'planned' | 'done' | 'cancelled';

export interface OneTimeEvent {
  id: string;
  name: string;
  /** AED, signed. */
  amount: number;
  month: Month;
  kind: OneTimeEventKind;
  status: OneTimeEventStatus;
}

export type Currency = 'AED' | 'INR';

export interface Debt {
  id: string;
  creditor: string;
  /** In the debt's own currency. */
  originalAmount: number;
  /** In the debt's own currency. */
  currentBalance: number;
  /** 1 = paid first. */
  priority: number;
  currency: Currency;
  /** Units of currency per 1 AED; required when currency !== 'AED'. */
  fxRate: number | null;
  notes?: string;
}

export type DefermentStatus = 'planned' | 'confirmed' | 'used';

export interface Deferment {
  id: string;
  /** RecurringItem whose payment is skipped. */
  targetItemId: string;
  /** The month in which no payment is due. */
  month: Month;
  /** AED, charged in the deferment month. */
  fee: number;
  status: DefermentStatus;
}

export interface PlanInput {
  recurringItems: RecurringItem[];
  oneTimeEvents: OneTimeEvent[];
  debts: Debt[];
  deferments: Deferment[];
}

export interface DebtPayment {
  debtId: string;
  /** AED. */
  amount: number;
}

export interface MonthFlags {
  rentChequeMonth: boolean;
  defermentMonth: boolean;
  /** Debt ids fully cleared in this month. */
  debtsCleared: string[];
}

export interface MonthProjection {
  month: Month;
  /** Recurring income (positive). */
  income: number;
  /** Loan EMI after deferments (negative or 0). */
  loanEmi: number;
  /** Recurring fixed costs (negative). */
  fixedCosts: number;
  /** Non-rent-cheque one-time events, net (signed). */
  oneTime: number;
  /** Rent cheque events (negative or 0). */
  rentCheques: number;
  /** Deferment fees (negative or 0). */
  defermentFees: number;
  netCashFlow: number;
  debtPayments: DebtPayment[];
  /** AED balance per debt id after this month's payments. */
  debtBalancesAed: Record<string, number>;
  /** Cumulative cash not allocated to debt (can go negative in rent-cheque months). */
  buffer: number;
  flags: MonthFlags;
}

export interface ProjectionSummary {
  /** Total starting debt in AED. */
  totalDebtAed: number;
  /** Debt id -> month it clears, for debts cleared within the horizon. */
  clearMonthByDebt: Record<string, Month>;
}

export interface Projection {
  months: MonthProjection[];
  /** First month with all debts at zero, or null if not reached in the horizon. */
  debtFreeMonth: Month | null;
  summary: ProjectionSummary;
}
