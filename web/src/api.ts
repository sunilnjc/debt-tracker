import type { Debt, Projection, RecurringItem } from './types';

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
