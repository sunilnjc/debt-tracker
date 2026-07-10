import type { Month, MonthProjection } from './types';

export interface SavingsTarget {
  id: string;
  label: string;
  amount: number;
}

export interface SavingsForecastEntry {
  target: SavingsTarget;
  /** First projected month the buffer reaches the target, or null if not within horizon. */
  achievedMonth: Month | null;
}

export interface SavingsForecast {
  entries: SavingsForecastEntry[];
  /** Cumulative buffer at the end of the horizon (projected savings). */
  finalBuffer: number;
}

// From the financial plan §8 (SPEC §3.6). Stage 3 ≈ 1 month of expenses,
// stage 4 ≈ 3 months — kept as round numbers here.
export const DEFAULT_SAVINGS_TARGETS: SavingsTarget[] = [
  { id: 'stage-1', label: 'Emergency buffer', amount: 5000 },
  { id: 'stage-2', label: 'Stage 2', amount: 15000 },
  { id: 'stage-3', label: '~1 month of expenses', amount: 24000 },
  { id: 'stage-4', label: '~3 months of expenses', amount: 72000 },
];

/**
 * Projected savings milestones read from the projection's buffer trajectory.
 * A target is "reached" the first month its cumulative buffer >= the amount.
 * No new engine state — savings are just the buffer once debts are cleared.
 */
export function forecastSavings(
  months: MonthProjection[],
  targets: SavingsTarget[] = DEFAULT_SAVINGS_TARGETS,
): SavingsForecast {
  const entries = targets.map((target) => {
    const hit = months.find((m) => m.buffer >= target.amount);
    return { target, achievedMonth: hit ? hit.month : null };
  });

  const finalBuffer = months.length > 0 ? months[months.length - 1]!.buffer : 0;

  return { entries, finalBuffer };
}
