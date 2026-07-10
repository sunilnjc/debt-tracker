import type {
  CategorySummary,
  Debt,
  DebtPaymentRecord,
  Deferment,
  Expense,
  MonthClose,
  Projection,
  RecurringItem,
  SavingsForecast,
  SpendingTrends,
} from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `${path} failed: ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const fetchProjection = (months = 12) => request<Projection>(`/projection?months=${months}`);

export const fetchRecurringItems = () => request<RecurringItem[]>('/recurring-items');

export const fetchDebts = () => request<Debt[]>('/debts');

export const updateRecurringItem = (id: string, patch: Partial<RecurringItem>) =>
  request<RecurringItem>(`/recurring-items/${id}`, { method: 'PUT', body: JSON.stringify(patch) });

export const updateDebt = (id: string, patch: Partial<Debt>) =>
  request<Debt>(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(patch) });

export const fetchExpenses = (month: string) => request<Expense[]>(`/expenses?month=${month}`);

export const createExpense = (expense: Omit<Expense, 'id'>) =>
  request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(expense) });

export const deleteExpense = (id: string) =>
  request<void>(`/expenses/${id}`, { method: 'DELETE' });

export const fetchBudgetVsActual = (month: string) =>
  request<CategorySummary[]>(`/expenses/summary?month=${month}`);

export const fetchMonthCloses = () => request<MonthClose[]>('/month-close');

export const closeMonth = (month: string) =>
  request<MonthClose>('/month-close', { method: 'POST', body: JSON.stringify({ month }) });

export interface ScenarioOverrides {
  recurringItems?: Record<string, Partial<RecurringItem>>;
}

export const fetchScenarioProjection = (months: number, overrides: ScenarioOverrides) =>
  request<Projection>('/projection/scenario', { method: 'POST', body: JSON.stringify({ months, overrides }) });

export const fetchDebtPayments = (debtId: string) => request<DebtPaymentRecord[]>(`/debts/${debtId}/payments`);

export const logDebtPayment = (debtId: string, payment: { amount: number; date: string; note?: string }) =>
  request<DebtPaymentRecord>(`/debts/${debtId}/payments`, { method: 'POST', body: JSON.stringify(payment) });

export const fetchDeferments = () => request<Deferment[]>('/deferments');

export const createDeferment = (deferment: Deferment) =>
  request<Deferment>('/deferments', { method: 'POST', body: JSON.stringify(deferment) });

export const fetchSavings = (months = 36) => request<SavingsForecast>(`/savings?months=${months}`);

export const fetchSpendingTrends = (from: string, to: string) =>
  request<SpendingTrends>(`/expenses/trends?from=${from}&to=${to}`);
