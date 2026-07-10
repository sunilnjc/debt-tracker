import { useState } from 'react';
import type { MonthClose, Projection } from '../types';

interface Props {
  projection: Projection;
  monthCloses: MonthClose[];
  onCloseMonth: (month: string) => Promise<void>;
}

const fmt = (n: number) => (n === 0 ? '—' : n.toLocaleString('en-US'));

function CloseButton({ month, onCloseMonth }: { month: string; onCloseMonth: (month: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setSaving(true);
    setError(null);
    try {
      await onCloseMonth(month);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={saving}>
        {saving ? 'Closing…' : 'Close'}
      </button>
      {error && <span className="edit-error">{error}</span>}
    </span>
  );
}

export function ProjectionTable({ projection, monthCloses, onCloseMonth }: Props) {
  const closeByMonth = new Map(monthCloses.map((c) => [c.month, c]));

  return (
    <table className="projection-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Salary</th>
          <th>One-time</th>
          <th>Loan EMI</th>
          <th>Fixed costs</th>
          <th>Rent cheque</th>
          <th>Net (projected)</th>
          <th>Net (actual)</th>
          <th>Debt paid</th>
          <th>Remaining debt</th>
          <th>Close-out</th>
        </tr>
      </thead>
      <tbody>
        {projection.months.map((m) => {
          const remaining = Object.values(m.debtBalancesAed).reduce((a, b) => a + b, 0);
          const rowClass = m.flags.rentChequeMonth ? 'row-rent' : m.flags.defermentMonth ? 'row-defer' : '';
          const close = closeByMonth.get(m.month);
          return (
            <tr key={m.month} className={rowClass}>
              <td>{m.month}</td>
              <td>{fmt(m.income)}</td>
              <td>{fmt(m.oneTime)}</td>
              <td>{fmt(m.loanEmi)}</td>
              <td>{fmt(m.fixedCosts)}</td>
              <td>{fmt(m.rentCheques)}</td>
              <td className={m.netCashFlow < 0 ? 'negative' : ''}>{fmt(m.netCashFlow)}</td>
              <td className={close && close.actualNetCashFlow < 0 ? 'negative' : ''}>
                {close ? fmt(close.actualNetCashFlow) : '—'}
              </td>
              <td>
                {m.debtPayments.length === 0
                  ? '—'
                  : m.debtPayments.map((p) => `${p.debtId} ${fmt(p.amount)}`).join(', ')}
                {m.flags.debtsCleared.length > 0 && (
                  <span className="cleared-badge"> 🎉 {m.flags.debtsCleared.join(', ')}</span>
                )}
              </td>
              <td>{remaining === 0 ? '0 🎉' : fmt(remaining)}</td>
              <td>
                {close ? (
                  <span className="closed-badge">Closed ✓</span>
                ) : (
                  <CloseButton month={m.month} onCloseMonth={onCloseMonth} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
