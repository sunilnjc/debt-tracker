import { useEffect, useState } from 'react';
import { fetchBudgetVsActual } from '../api';
import type { CategorySummary } from '../types';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const fmt = (n: number) => n.toLocaleString('en-US');

interface Props {
  /** Bump this (e.g. after logging an expense) to force a refetch. */
  refreshSignal?: number;
}

export function BudgetVsActual({ refreshSignal }: Props) {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<CategorySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBudgetVsActual(month)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [month, refreshSignal]);

  return (
    <section className="budget-vs-actual">
      <h2>
        Budget vs. actual{' '}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month"
        />
      </h2>
      {error && <p className="error">Failed to load: {error}</p>}
      {rows && (
        <table className="budget-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Budgeted</th>
              <th>Actual</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No data for this month.</td>
              </tr>
            ) : (
              rows.map((row) => {
                const delta = row.budgeted - row.actual;
                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{fmt(row.budgeted)}</td>
                    <td>{fmt(row.actual)}</td>
                    <td className={delta < 0 ? 'over-budget' : 'under-budget'}>
                      {delta < 0 ? `${fmt(Math.abs(delta))} over` : `${fmt(delta)} left`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
