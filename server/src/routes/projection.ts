import { Router } from 'express';
import { DebtModel, DefermentModel, OneTimeEventModel, RecurringItemModel, toEngine } from '../models';
import { project } from '../engine/project';
import { PLAN_START } from '../engine/seed-data';
import type { Debt, Deferment, OneTimeEvent, RecurringItem } from '../engine/types';

export const projectionRouter = Router();

const MAX_HORIZON_MONTHS = 36;
const DEFAULT_HORIZON_MONTHS = 12;

projectionRouter.get('/', async (req, res) => {
  const monthsParam = Number(req.query.months ?? DEFAULT_HORIZON_MONTHS);
  if (!Number.isInteger(monthsParam) || monthsParam < 1 || monthsParam > MAX_HORIZON_MONTHS) {
    res.status(400).json({ error: `months must be an integer between 1 and ${MAX_HORIZON_MONTHS}` });
    return;
  }

  const [recurringDocs, eventDocs, debtDocs, defermentDocs] = await Promise.all([
    RecurringItemModel.find().lean(),
    OneTimeEventModel.find().lean(),
    DebtModel.find().lean(),
    DefermentModel.find().lean(),
  ]);

  const recurringItems = recurringDocs.map((d) => toEngine<RecurringItem>(d as any));
  const oneTimeEvents = eventDocs.map((d) => toEngine<OneTimeEvent>(d as any));
  const debts = debtDocs.map((d) => toEngine<Debt>(d as any));
  const deferments = defermentDocs.map((d) => toEngine<Deferment>(d as any));

  const startMonth = recurringItems
    .map((i) => i.startMonth)
    .sort()[0] ?? PLAN_START;

  const projection = project(
    { recurringItems, oneTimeEvents, debts, deferments },
    startMonth,
    monthsParam,
  );

  res.json(projection);
});
