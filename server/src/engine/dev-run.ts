/**
 * Scratch runner: prints the 12-month projection from seed data.
 * Run with: npm run engine:dev
 */
import { PLAN_START, seedPlan } from './seed-data';
import { project } from './project';

const fmt = (n: number) => (n === 0 ? '—' : n.toLocaleString('en-US'));

const projection = project(seedPlan, PLAN_START, 12);

console.log('Month    | Net     | Debt payments                | Buffer  | Flags');
console.log('---------|---------|------------------------------|---------|------');
for (const m of projection.months) {
  const payments = m.debtPayments.map((p) => `${p.debtId} ${fmt(p.amount)}`).join(', ') || '—';
  const flags = [
    m.flags.rentChequeMonth ? 'rent' : '',
    m.flags.defermentMonth ? 'defer' : '',
    ...m.flags.debtsCleared.map((id) => `${id} CLEARED`),
  ]
    .filter(Boolean)
    .join(' ');
  console.log(
    `${m.month}  | ${fmt(m.netCashFlow).padStart(7)} | ${payments.padEnd(28)} | ${fmt(m.buffer).padStart(7)} | ${flags}`,
  );
}

console.log('\nTotal debt (AED):', projection.summary.totalDebtAed.toLocaleString('en-US'));
console.log('Clear months:', projection.summary.clearMonthByDebt);
console.log('DEBT-FREE MONTH:', projection.debtFreeMonth ?? 'not within horizon');
