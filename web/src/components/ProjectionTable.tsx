import type { Projection } from '../types';

interface Props {
  projection: Projection;
}

const fmt = (n: number) => (n === 0 ? '—' : n.toLocaleString('en-US'));

export function ProjectionTable({ projection }: Props) {
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
          <th>Net</th>
          <th>Debt paid</th>
          <th>Remaining debt</th>
        </tr>
      </thead>
      <tbody>
        {projection.months.map((m) => {
          const remaining = Object.values(m.debtBalancesAed).reduce((a, b) => a + b, 0);
          const rowClass = m.flags.rentChequeMonth ? 'row-rent' : m.flags.defermentMonth ? 'row-defer' : '';
          return (
            <tr key={m.month} className={rowClass}>
              <td>{m.month}</td>
              <td>{fmt(m.income)}</td>
              <td>{fmt(m.oneTime)}</td>
              <td>{fmt(m.loanEmi)}</td>
              <td>{fmt(m.fixedCosts)}</td>
              <td>{fmt(m.rentCheques)}</td>
              <td className={m.netCashFlow < 0 ? 'negative' : ''}>{fmt(m.netCashFlow)}</td>
              <td>
                {m.debtPayments.length === 0
                  ? '—'
                  : m.debtPayments.map((p) => `${p.debtId} ${fmt(p.amount)}`).join(', ')}
                {m.flags.debtsCleared.length > 0 && (
                  <span className="cleared-badge"> 🎉 {m.flags.debtsCleared.join(', ')}</span>
                )}
              </td>
              <td>{remaining === 0 ? '0 🎉' : fmt(remaining)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
