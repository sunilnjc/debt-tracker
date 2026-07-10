import { Router } from 'express';
import { project } from '../engine/project';
import type { RecurringItem } from '../engine/types';
import { MAX_HORIZON_MONTHS, earliestStartMonth, loadPlanInput, parseMonths } from './plan-input';

export const projectionRouter = Router();

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
