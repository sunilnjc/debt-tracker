import { Router } from 'express';
import { DebtModel, DefermentModel, OneTimeEventModel, RecurringItemModel, toEngine } from '../models';
import { project } from '../engine/project';
import { PLAN_START } from '../engine/seed-data';
import type { Debt, Deferment, OneTimeEvent, PlanInput, RecurringItem } from '../engine/types';

export const projectionRouter = Router();

const MAX_HORIZON_MONTHS = 36;
const DEFAULT_HORIZON_MONTHS = 12;

function parseMonths(value: unknown): number | null {
  const n = Number(value ?? DEFAULT_HORIZON_MONTHS);
  return Number.isInteger(n) && n >= 1 && n <= MAX_HORIZON_MONTHS ? n : null;
}

async function loadPlanInput(): Promise<PlanInput> {
  const [recurringDocs, eventDocs, debtDocs, defermentDocs] = await Promise.all([
    RecurringItemModel.find().lean(),
    OneTimeEventModel.find().lean(),
    DebtModel.find().lean(),
    DefermentModel.find().lean(),
  ]);

  return {
    recurringItems: recurringDocs.map((d) => toEngine<RecurringItem>(d as any)),
    oneTimeEvents: eventDocs.map((d) => toEngine<OneTimeEvent>(d as any)),
    debts: debtDocs.map((d) => toEngine<Debt>(d as any)),
    deferments: defermentDocs.map((d) => toEngine<Deferment>(d as any)),
  };
}

function earliestStartMonth(recurringItems: RecurringItem[]): string {
  return recurringItems.map((i) => i.startMonth).sort()[0] ?? PLAN_START;
}

projectionRouter.get('/', async (req, res) => {
  const months = parseMonths(req.query.months);
  if (months === null) {
    res.status(400).json({ error: `months must be an integer between 1 and ${MAX_HORIZON_MONTHS}` });
    return;
  }

  const plan = await loadPlanInput();
  res.json(project(plan, earliestStartMonth(plan.recurringItems), months));
});

// Projects with in-memory overrides — never writes to the database. Powers
// "what if my salary changed?" without touching real data.
projectionRouter.post('/scenario', async (req, res) => {
  const months = parseMonths(req.body?.months);
  if (months === null) {
    res.status(400).json({ error: `months must be an integer between 1 and ${MAX_HORIZON_MONTHS}` });
    return;
  }

  const recurringItemOverrides = req.body?.overrides?.recurringItems as
    | Record<string, Partial<RecurringItem>>
    | undefined;

  const plan = await loadPlanInput();
  const recurringItems = recurringItemOverrides
    ? plan.recurringItems.map((item) =>
        recurringItemOverrides[item.id] ? { ...item, ...recurringItemOverrides[item.id] } : item,
      )
    : plan.recurringItems;

  const projection = project({ ...plan, recurringItems }, earliestStartMonth(recurringItems), months);
  res.json(projection);
});
