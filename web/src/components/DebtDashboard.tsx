import { useState } from 'react';
import type { Debt, DebtPaymentRecord, ProjectionSummary } from '../types';
import { overallPaidOffPercent } from '../debtMath';
import { EditableAmount } from './EditableAmount';

interface Props {
  debts: Debt[];
  summary: ProjectionSummary;
  debtFreeMonth: string | null;
  onUpdateBalance: (id: string, next: number) => Promise<void>;
  paymentsByDebt: Record<string, DebtPaymentRecord[]>;
  onLogPayment: (debtId: string, amount: number, date: string) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

function DebtPaymentLog({
  debtId,
  payments,
  onLogPayment,
}: {
  debtId: string;
  payments: DebtPaymentRecord[];
  onLogPayment: (debtId: string, amount: number, date: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('enter a positive amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onLogPayment(debtId, parsed, date);
      setAmount('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payment-log">
      <form className="payment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label={`Payment amount for ${debtId}`}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label={`Payment date for ${debtId}`}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Logging…' : 'Log payment'}
        </button>
      </form>
      {error && <span className="edit-error">{error}</span>}
      {payments.length > 0 && (
        <ul className="payment-history">
          {[...payments]
            .slice(-3)
            .reverse()
            .map((p) => (
              <li key={p.id}>
                {p.date}: {p.amount.toLocaleString('en-US')}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export function DebtDashboard({ debts, summary, debtFreeMonth, onUpdateBalance, paymentsByDebt, onLogPayment }: Props) {
  const sorted = [...debts].sort((a, b) => a.priority - b.priority);
  const overallPct = overallPaidOffPercent(debts);

  return (
    <section className="debt-dashboard">
      <div className="debt-banner">
        <div>
          <span className="label">Total remaining debt</span>
          <span className="value">{summary.totalDebtAed.toLocaleString('en-US')} AED</span>
        </div>
        <div>
          <span className="label">Projected debt-free</span>
          <span className="value">{debtFreeMonth ?? 'beyond horizon'}</span>
        </div>
      </div>
      <div className="overall-progress">
        <div className="progress-bar overall-progress-bar">
          <div className="progress-fill" style={{ width: `${overallPct}%` }} />
        </div>
        <span className="overall-progress-label">{overallPct}% paid off</span>
      </div>
      <div className="debt-cards">
        {sorted.map((d) => {
          const paid = d.originalAmount - d.currentBalance;
          const pct = d.originalAmount > 0 ? Math.round((paid / d.originalAmount) * 100) : 100;
          const clearMonth = summary.clearMonthByDebt[d.id];
          return (
            <div className="debt-card" key={d.id}>
              <h3>{d.creditor}</h3>
              <p className="priority">Priority {d.priority}</p>
              <p className="balance-line">
                <EditableAmount value={d.currentBalance} onSave={(next) => onUpdateBalance(d.id, next)} />{' '}
                {d.currency}
                {d.currency === 'INR' && d.fxRate && (
                  <span className="fx-note">
                    {' '}
                    (~{Math.round(d.currentBalance / d.fxRate).toLocaleString('en-US')} AED)
                  </span>
                )}
              </p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="clear-month">{clearMonth ? `Clears ${clearMonth}` : 'Beyond horizon'}</p>
              <DebtPaymentLog
                debtId={d.id}
                payments={paymentsByDebt[d.id] ?? []}
                onLogPayment={onLogPayment}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
