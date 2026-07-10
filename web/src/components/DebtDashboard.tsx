import type { Debt, ProjectionSummary } from '../types';
import { EditableAmount } from './EditableAmount';

interface Props {
  debts: Debt[];
  summary: ProjectionSummary;
  debtFreeMonth: string | null;
  onUpdateBalance: (id: string, next: number) => Promise<void>;
}

export function DebtDashboard({ debts, summary, debtFreeMonth, onUpdateBalance }: Props) {
  const sorted = [...debts].sort((a, b) => a.priority - b.priority);

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
            </div>
          );
        })}
      </div>
    </section>
  );
}
