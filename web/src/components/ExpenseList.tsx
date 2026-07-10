import { useCallback, useEffect, useState } from 'react';
import { deleteExpense, fetchExpenses } from '../api';
import type { Expense } from '../types';

interface Props {
  /** YYYY-MM to list. */
  month: string;
  /** Bump to refetch (e.g. after logging a new expense elsewhere). */
  refreshSignal?: number;
  /** Called after a successful delete so parents can refresh dependent views. */
  onChanged?: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-US');

export function ExpenseList({ month, refreshSignal, onChanged }: Props) {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchExpenses(month);
      setExpenses(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchExpenses(month);
        if (!cancelled) {
          setExpenses(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, refreshSignal]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      await load();
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const total = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return (
    <div className="expense-list">
      {error && <p className="error">Failed to load: {error}</p>}
      {expenses && expenses.length === 0 && (
        <p className="clear-month">No expenses logged for {month}.</p>
      )}
      {expenses && expenses.length > 0 && (
        <>
          <p className="expense-list-total">
            {expenses.length} expense{expenses.length === 1 ? '' : 's'} · {fmt(total)} AED in {month}
          </p>
          <ul>
            {expenses.map((e) => (
              <li key={e.id} className="expense-row">
                <span className="expense-date">{e.date}</span>
                <span className="expense-category">{e.category}</span>
                <span className="expense-amount">{fmt(e.amount)}</span>
                <span className="expense-note">{e.note ?? ''}</span>
                <button
                  type="button"
                  className="expense-delete"
                  disabled={deletingId === e.id}
                  onClick={() => handleDelete(e.id)}
                  aria-label={`Delete expense ${e.id}`}
                >
                  {deletingId === e.id ? '…' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
