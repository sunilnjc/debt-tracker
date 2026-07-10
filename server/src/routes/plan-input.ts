import { DebtModel, DefermentModel, OneTimeEventModel, RecurringItemModel, toEngine } from '../models';
import { PLAN_START } from '../engine/seed-data';
import type { Debt, Deferment, OneTimeEvent, PlanInput, RecurringItem } from '../engine/types';

export const MAX_HORIZON_MONTHS = 36;
export const DEFAULT_HORIZON_MONTHS = 12;

export function parseMonths(value: unknown, fallback = DEFAULT_HORIZON_MONTHS): number | null {
  const n = Number(value ?? fallback);
  return Number.isInteger(n) && n >= 1 && n <= MAX_HORIZON_MONTHS ? n : null;
}

/** Loads all four plan collections from Mongo and maps them to engine types. */
export async function loadPlanInput(): Promise<PlanInput> {
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

export function earliestStartMonth(recurringItems: RecurringItem[]): string {
  return recurringItems.map((i) => i.startMonth).sort()[0] ?? PLAN_START;
}
