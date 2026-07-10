import { Router } from 'express';
import { ExpenseModel, type Expense, toEngine } from '../models';
import { crudRouter } from './crud';

export const expensesRouter = Router();

// Optional ?month=YYYY-MM filter. Dates are stored as YYYY-MM-DD strings, so
// a lexicographic range works without parsing real calendar dates: "-32" sorts
// after every valid day in the month and before the next month starts.
expensesRouter.get('/', async (req, res) => {
  const month = req.query.month as string | undefined;
  const filter = month ? { date: { $gte: `${month}-01`, $lt: `${month}-32` } } : {};
  const docs = await ExpenseModel.find(filter).sort({ date: 1 }).lean();
  res.json(docs.map((d) => toEngine<Expense>(d as any)));
});

expensesRouter.use('/', crudRouter<Expense>(ExpenseModel));
