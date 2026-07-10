import { useEffect, useState } from 'react';
import { fetchSavings } from '../api';
import type { SavingsForecast } from '../types';

const fmt = (n: number) => n.toLocaleString('en-US');

export function SavingsTracker() {
  const [forecast, setForecast] = useState<SavingsForecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSavings(36);
        if (!cancelled) {
          setForecast(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="savings-tracker">
        <h2>Savings stages</h2>
        <p className="error">Failed to load: {error}</p>
      </section>
    );
  }

  if (!forecast) {
    return (
      <section className="savings-tracker">
        <h2>Savings stages</h2>
        <p className="clear-month">Loading…</p>
      </section>
    );
  }

  return (
    <section className="savings-tracker">
      <h2>Savings stages</h2>
      <p className="savings-subtitle">
        Projected {fmt(forecast.finalBuffer)} AED saved by the end of the 3-year horizon
        {forecast.debtFreeMonth && ` · debt-free ${forecast.debtFreeMonth}`}
      </p>
      <ul className="savings-list">
        {forecast.entries.map(({ target, achievedMonth }) => {
          const pct = Math.min(100, Math.round((forecast.finalBuffer / target.amount) * 100));
          return (
            <li key={target.id} className="savings-stage">
              <div className="savings-stage-head">
                <span className="savings-stage-label">
                  {target.label} ({fmt(target.amount)} AED)
                </span>
                <span className="savings-stage-month">{achievedMonth ?? 'beyond horizon'}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
