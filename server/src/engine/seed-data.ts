/**
 * Sunil's financial plan (docs/FINANCIAL-PLAN-2026.md) as engine input.
 * Single source of truth for seed numbers — the seed script (BT-003) and the
 * acceptance tests (BT-006) both import from here.
 */
import type { Debt, Deferment, OneTimeEvent, PlanInput, RecurringItem } from './types';

export const PLAN_START = '2026-07';

export const recurringItems: RecurringItem[] = [
  { id: 'salary', name: 'Monthly Salary', amount: 32000, category: 'income', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'loan-emi', name: 'Loan EMI', amount: -15420, category: 'loan_emi', frequency: 'monthly', startMonth: PLAN_START, endMonth: null, notes: 'Emirates NBD personal loan' },
  { id: 'tithe', name: 'Tithe', amount: -3000, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'home-transfer', name: 'Home (family transfer)', amount: -3600, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'postpaid-internet', name: 'Postpaid & Internet', amount: -740, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'dewa', name: 'DEWA Bill', amount: -90, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'petrol', name: 'Petrol', amount: -300, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'grocery', name: 'Grocery', amount: -600, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'house-cleaning', name: 'House Cleaning', amount: -200, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
  { id: 'car-cleaning', name: 'Car Cleaning', amount: -160, category: 'fixed_cost', frequency: 'monthly', startMonth: PLAN_START, endMonth: null },
];

export const oneTimeEvents: OneTimeEvent[] = [
  { id: 'tabby-final', name: 'Tabby final payment', amount: -3782, month: '2026-07', kind: 'other', status: 'planned' },
  { id: 'crypto-cashout', name: 'Crypto cash-out (~$3,000)', amount: 11000, month: '2026-08', kind: 'other', status: 'planned' },
  { id: 'rent-cheque-1', name: 'Rent cheque #1 (incl. commission)', amount: -15000, month: '2026-08', kind: 'rent_cheque', status: 'planned' },
  { id: 'rent-cheque-2', name: 'Rent cheque #2', amount: -11500, month: '2026-11', kind: 'rent_cheque', status: 'planned' },
  { id: 'rent-cheque-3', name: 'Rent cheque #3', amount: -11500, month: '2027-02', kind: 'rent_cheque', status: 'planned' },
  { id: 'rent-cheque-4', name: 'Rent cheque #4', amount: -11500, month: '2027-05', kind: 'rent_cheque', status: 'planned' },
];

export const debts: Debt[] = [
  { id: 'shruthi', creditor: 'Shruthi', originalAmount: 20000, currentBalance: 20000, priority: 1, currency: 'AED', fxRate: null },
  { id: 'bhagya', creditor: 'Bhagya', originalAmount: 5000, currentBalance: 5000, priority: 2, currency: 'AED', fxRate: null },
  { id: 'paul', creditor: 'Paul', originalAmount: 5000, currentBalance: 5000, priority: 3, currency: 'AED', fxRate: null },
  // Plan values the 3 lakh INR at 13,500 AED; rate chosen to reproduce that exactly.
  { id: 'arun', creditor: 'Arun', originalAmount: 300000, currentBalance: 300000, priority: 4, currency: 'INR', fxRate: 22.2222 },
  { id: 'credit-card', creditor: 'Credit Card', originalAmount: 10000, currentBalance: 10000, priority: 5, currency: 'AED', fxRate: null },
];

// Deferment month = the calendar month with no EMI due (application happens the
// month before, per Emirates NBD's 5-working-day lead time).
export const deferments: Deferment[] = [
  { id: 'def-feb27', targetItemId: 'loan-emi', month: '2027-02', fee: 105, status: 'planned' },
  { id: 'def-apr27', targetItemId: 'loan-emi', month: '2027-04', fee: 105, status: 'planned' },
];

export const seedPlan: PlanInput = { recurringItems, oneTimeEvents, debts, deferments };
