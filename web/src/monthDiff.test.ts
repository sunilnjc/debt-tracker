import { describe, expect, it } from 'vitest';
import { monthsBetween } from './monthDiff';

describe('monthsBetween', () => {
  it('is positive when `to` is later', () => {
    expect(monthsBetween('2026-10', '2027-03')).toBe(5);
  });

  it('is negative when `to` is earlier', () => {
    expect(monthsBetween('2027-03', '2026-10')).toBe(-5);
  });

  it('is zero for the same month', () => {
    expect(monthsBetween('2026-07', '2026-07')).toBe(0);
  });

  it('crosses year boundaries', () => {
    expect(monthsBetween('2026-12', '2027-01')).toBe(1);
  });
});
