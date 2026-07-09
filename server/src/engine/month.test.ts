import { describe, expect, it } from 'vitest';
import { addMonths, compareMonths, isValidMonth, monthRange } from './month';

describe('addMonths', () => {
  it('adds within a year', () => {
    expect(addMonths('2026-07', 1)).toBe('2026-08');
  });

  it('rolls over year boundaries', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-07', 12)).toBe('2027-07');
  });

  it('subtracts across year boundaries', () => {
    expect(addMonths('2027-01', -1)).toBe('2026-12');
    expect(addMonths('2027-02', -14)).toBe('2025-12');
  });
});

describe('compareMonths', () => {
  it('orders months', () => {
    expect(compareMonths('2026-07', '2026-08')).toBeLessThan(0);
    expect(compareMonths('2027-01', '2026-12')).toBeGreaterThan(0);
    expect(compareMonths('2026-07', '2026-07')).toBe(0);
  });
});

describe('monthRange', () => {
  it('generates consecutive months', () => {
    expect(monthRange('2026-11', 3)).toEqual(['2026-11', '2026-12', '2027-01']);
  });
});

describe('isValidMonth', () => {
  it('accepts YYYY-MM and rejects everything else', () => {
    expect(isValidMonth('2026-07')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-7')).toBe(false);
    expect(isValidMonth('26-07')).toBe(false);
  });
});
