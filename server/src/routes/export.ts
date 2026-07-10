import { Router } from 'express';
import {
  DebtModel,
  DebtPaymentModel,
  DefermentModel,
  ExpenseModel,
  MonthCloseModel,
  OneTimeEventModel,
  RecurringItemModel,
  toEngine,
} from '../models';

export const exportRouter = Router();

// Full JSON backup of every collection (engine shape, `id` not `_id`).
exportRouter.get('/', async (_req, res) => {
  const [recurringItems, oneTimeEvents, debts, deferments, expenses, monthCloses, debtPayments] =
    await Promise.all([
      RecurringItemModel.find().lean(),
      OneTimeEventModel.find().lean(),
      DebtModel.find().lean(),
      DefermentModel.find().lean(),
      ExpenseModel.find().lean(),
      MonthCloseModel.find().lean(),
      DebtPaymentModel.find().lean(),
    ]);

  const map = (docs: unknown[]) => docs.map((d) => toEngine(d as any));

  res.setHeader('Content-Disposition', 'attachment; filename="budgettracker-backup.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    recurringItems: map(recurringItems),
    oneTimeEvents: map(oneTimeEvents),
    debts: map(debts),
    deferments: map(deferments),
    expenses: map(expenses),
    monthCloses: map(monthCloses),
    debtPayments: map(debtPayments),
  });
});

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Expenses as CSV.
exportRouter.get('/expenses.csv', async (_req, res) => {
  const docs = await ExpenseModel.find().sort({ date: 1 }).lean();
  const rows = docs.map((d) => toEngine<{ id: string; date: string; category: string; amount: number; note?: string }>(d as any));

  const header = ['id', 'date', 'category', 'amount', 'note'];
  const lines = [
    header.join(','),
    ...rows.map((r) => [r.id, r.date, r.category, r.amount, r.note ?? ''].map(csvCell).join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(lines.join('\n'));
});
