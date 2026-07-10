import { addMonths, compareMonths, monthsBetween } from './month';
import type { Deferment, Month } from './types';

export interface DefermentCandidate {
  targetItemId: string;
  month: Month;
}

/**
 * Enforces "2 non-consecutive deferments per loan cycle year" (per the
 * financial plan, docs/FINANCIAL-PLAN-2026.md §5) for a candidate deferment
 * against a loan's existing ones. Returns a violation message, or null if fine.
 */
export function checkDefermentRule(candidate: DefermentCandidate, existing: Deferment[]): string | null {
  const sameTarget = existing.filter((d) => d.targetItemId === candidate.targetItemId);

  const adjacent = sameTarget.find((d) => Math.abs(monthsBetween(d.month, candidate.month)) === 1);
  if (adjacent) {
    return (
      `${candidate.month} is adjacent to an existing deferment in ${adjacent.month} ` +
      `for ${candidate.targetItemId} — deferments must be non-consecutive`
    );
  }

  const windowStart = addMonths(candidate.month, -11);
  const withinWindow = sameTarget.filter(
    (d) => compareMonths(d.month, windowStart) >= 0 && compareMonths(d.month, candidate.month) <= 0,
  );
  if (withinWindow.length >= 2) {
    return (
      `already have ${withinWindow.length} deferment(s) for ${candidate.targetItemId} within the 12 months ` +
      `ending ${candidate.month} — max 2 per loan cycle year`
    );
  }

  return null;
}
