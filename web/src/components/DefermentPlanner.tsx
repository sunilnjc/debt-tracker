import { useState } from 'react';
import type { Deferment, RecurringItem } from '../types';

interface Props {
  deferments: Deferment[];
  loanItems: RecurringItem[];
  onAddDeferment: (deferment: Deferment) => Promise<void>;
}

const DEFAULT_FEE = 105;

export function DefermentPlanner({ deferments, loanItems, onAddDeferment }: Props) {
  const [targetItemId, setTargetItemId] = useState(loanItems[0]?.id ?? '');
  const [month, setMonth] = useState('');
  const [fee, setFee] = useState(String(DEFAULT_FEE));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) {
      setError('pick a month');
      return;
    }
    const parsedFee = Number(fee);
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setError('fee must be a non-negative number');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAddDeferment({
        id: `def-${month}`,
        targetItemId,
        month,
        fee: parsedFee,
        status: 'planned',
      });
      setMonth('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="deferment-planner">
      <h2>Loan deferments</h2>
      {deferments.length === 0 ? (
        <p className="clear-month">No deferments planned.</p>
      ) : (
        <ul className="deferment-list">
          {[...deferments]
            .sort((a, b) => a.month.localeCompare(b.month))
            .map((d) => (
              <li key={d.id}>
                {d.month} — {d.targetItemId} (fee {d.fee.toLocaleString('en-US')} AED, {d.status})
              </li>
            ))}
        </ul>
      )}
      <form className="deferment-form" onSubmit={handleSubmit}>
        <select
          value={targetItemId}
          onChange={(e) => setTargetItemId(e.target.value)}
          aria-label="Loan"
        >
          {loanItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Deferment month"
        />
        <input
          type="text"
          inputMode="decimal"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          aria-label="Fee"
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add deferment'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
