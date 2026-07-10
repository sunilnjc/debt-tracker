import type { Month } from './types';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(value: string): value is Month {
  return MONTH_RE.test(value);
}

export function addMonths(month: Month, count: number): Month {
  const [yearStr, monthStr] = month.split('-');
  const total = Number(yearStr) * 12 + (Number(monthStr) - 1) + count;
  const year = Math.floor(total / 12);
  const m = (total % 12 + 12) % 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function compareMonths(a: Month, b: Month): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function monthRange(start: Month, count: number): Month[] {
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

/** Number of months from `from` to `to`. Positive means `to` is later. */
export function monthsBetween(from: Month, to: Month): number {
  const [fy, fm] = from.split('-');
  const [ty, tm] = to.split('-');
  return Number(ty) * 12 + Number(tm) - (Number(fy) * 12 + Number(fm));
}
