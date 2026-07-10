import { Router } from 'express';
import { actualNetCashFlowForMonth } from '../engine/actuals';
import { isValidMonth } from '../engine/month';
import type { Deferment, OneTimeEvent, RecurringItem } from '../engine/types';
import {
  DefermentModel,
  type Expense,
  ExpenseModel,
  type MonthClose,
  MonthCloseModel,
  OneTimeEventModel,
  RecurringItemModel,
  toEngine,
} from '../models';

export const monthCloseRouter = Router();

monthCloseRouter.get('/', async (_req, res) => {
  const docs = await MonthCloseModel.find().lean();
  res.json(docs.map((d) => toEngine<MonthClose>(d as any)));
});

// Closing an already-closed month is a no-op: the existing snapshot is
// returned unchanged rather than recomputed, since the whole point of
// closing is to lock the number even if expenses are edited afterward.
monthCloseRouter.post('/', async (req, res) => {
  const month = req.body?.month as string | undefined;
  if (!month || !isValidMonth(month)) {
    res.status(400).json({ error: 'month (YYYY-MM) is required' });
    return;
  }

  const existing = await MonthCloseModel.findById(month).lean();
  if (existing) {
    res.json(toEngine<MonthClose>(existing as any));
    return;
  }

  const [recurringDocs, eventDocs, defermentDocs, expenseDocs] = await Promise.all([
    RecurringItemModel.find().lean(),
    OneTimeEventModel.find({ month }).lean(),
    DefermentModel.find({ month }).lean(),
    ExpenseModel.find({ date: { $gte: `${month}-01`, $lt: `${month}-32` } }).lean(),
  ]);

  const recurringItems = recurringDocs.map((d) => toEngine<RecurringItem>(d as any));
  const events = eventDocs.map((d) => toEngine<OneTimeEvent>(d as any));
  const deferments = defermentDocs.map((d) => toEngine<Deferment>(d as any));
  const expenses = expenseDocs.map((d) => toEngine<Expense>(d as any));

  const actualNetCashFlow = actualNetCashFlowForMonth(month, recurringItems, events, deferments, expenses);

  const doc = await MonthCloseModel.create({
    _id: month,
    month,
    actualNetCashFlow,
    closedAt: new Date().toISOString(),
  });
  res.status(201).json(toEngine<MonthClose>(doc.toObject() as any));
});
