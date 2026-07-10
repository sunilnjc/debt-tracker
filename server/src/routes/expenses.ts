import { Router } from 'express';
import { summarizeBudgetVsActual } from '../engine/budget';
import { isValidMonth } from '../engine/month';
import type { RecurringItem } from '../engine/types';
import { ExpenseModel, type Expense, RecurringItemModel, toEngine } from '../models';
import { crudRouter } from './crud';

export const expensesRouter = Router();

// Optional ?month=YYYY-MM filter. Dates are stored as YYYY-MM-DD strings, so
// a lexicographic range works without parsing real calendar dates: "-32" sorts
// after every valid day in the month and before the next month starts.
function monthDateFilter(month: string) {
  return { date: { $gte: `${month}-01`, $lt: `${month}-32` } };
}

expensesRouter.get('/', async (req, res) => {
  const month = req.query.month as string | undefined;
  const filter = month ? monthDateFilter(month) : {};
  const docs = await ExpenseModel.find(filter).sort({ date: 1 }).lean();
  res.json(docs.map((d) => toEngine<Expense>(d as any)));
});

// Budgeted (fixed-cost RecurringItems active that month, as positive amounts)
// vs. actual (logged expenses), grouped by category. Categories are just
// RecurringItem ids by convention (see models/index.ts), so the join is a
// plain map merge — no separate category table to keep in sync.
expensesRouter.get('/summary', async (req, res) => {
  const month = req.query.month as string | undefined;
  if (!month || !isValidMonth(month)) {
    res.status(400).json({ error: 'month (YYYY-MM) is required' });
    return;
  }

  const [expenseDocs, recurringDocs] = await Promise.all([
    ExpenseModel.find(monthDateFilter(month)).lean(),
    RecurringItemModel.find({ category: 'fixed_cost' }).lean(),
  ]);

  const expenses = expenseDocs.map((d) => toEngine<Expense>(d as any));
  const recurringItems = recurringDocs.map((d) => toEngine<RecurringItem>(d as any));

  res.json(summarizeBudgetVsActual(expenses, recurringItems, month));
});

expensesRouter.use('/', crudRouter<Expense>(ExpenseModel));
