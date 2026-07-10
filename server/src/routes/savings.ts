import { Router } from 'express';
import { project } from '../engine/project';
import { forecastSavings } from '../engine/savings';
import { MAX_HORIZON_MONTHS, earliestStartMonth, loadPlanInput, parseMonths } from './plan-input';

export const savingsRouter = Router();

// Savings default to a longer 36-month horizon: the interesting milestones land
// after the March-2027 debt-free date, past the projection's default 12 months.
savingsRouter.get('/', async (req, res) => {
  const months = parseMonths(req.query.months, MAX_HORIZON_MONTHS);
  if (months === null) {
    res.status(400).json({ error: `months must be an integer between 1 and ${MAX_HORIZON_MONTHS}` });
    return;
  }

  const plan = await loadPlanInput();
  const projection = project(plan, earliestStartMonth(plan.recurringItems), months);
  res.json({ ...forecastSavings(projection.months), debtFreeMonth: projection.debtFreeMonth });
});
