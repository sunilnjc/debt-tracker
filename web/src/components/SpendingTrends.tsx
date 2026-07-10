import { useEffect, useState } from 'react';
import { fetchSpendingTrends } from '../api';
import type { SpendingTrends as SpendingTrendsData } from '../types';

const fmt = (n: number) => (n === 0 ? '—' : n.toLocaleString('en-US'));

/** Default range: the 6 months ending this month. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 7);
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const from = start.toISOString().slice(0, 7);
  return { from, to };
}

export function SpendingTrends() {
  const [{ from, to }, setRange] = useState(defaultRange);
  const [data, setData] = useState<SpendingTrendsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchSpendingTrends(from, to);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  // Largest single cell in the grid, for scaling the inline bars.
  const peak = data
    ? Math.max(1, ...data.categories.flatMap((c) => c.totals))
    : 1;

  return (
    <section className="spending-trends">
      <h2>
        Spending trends{' '}
        <input type="month" value={from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} aria-label="From" />
        {' → '}
        <input type="month" value={to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} aria-label="To" />
      </h2>
      {error && <p className="error">Failed to load: {error}</p>}
      {data && (
        data.categories.length === 0 ? (
          <p className="clear-month">No expenses logged in this range.</p>
        ) : (
          <div className="trends-scroll">
            <table className="trends-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {data.months.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.category}>
                    <td>{c.category}</td>
                    {c.totals.map((v, i) => (
                      <td key={data.months[i]} className="trend-cell">
                        <span className="trend-bar" style={{ width: `${Math.round((v / peak) * 100)}%` }} />
                        <span className="trend-value">{fmt(v)}</span>
                      </td>
                    ))}
                    <td className="trend-total">{fmt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}
