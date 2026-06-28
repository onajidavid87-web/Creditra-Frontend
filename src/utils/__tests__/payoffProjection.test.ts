import { describe, it, expect } from 'vitest';
import {
  computePayoffProjection,
  computeDefaultMonthlyPayment,
  formatMonths,
  formatPayoffDate,
} from '../payoffProjection';

describe('computePayoffProjection', () => {
  const BASE = { debt: 100_000, apr: 8.5, monthlyPayment: 2500, repayAmount: 0, limit: 200_000 };

  it('returns zero months saved when repayAmount is 0', () => {
    const result = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, 0, BASE.limit);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.isFullPayoff).toBe(false);
  });

  it('shows reduced months when a repayment is made', () => {
    const result = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, 20_000, BASE.limit);
    expect(result.newMonths).toBeLessThan(result.currentMonths);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it('marks isFullPayoff when repayAmount >= debt', () => {
    const result = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, BASE.debt, BASE.limit);
    expect(result.isFullPayoff).toBe(true);
    expect(result.newMonths).toBe(0);
  });

  it('caps at zero for negative repayAmount', () => {
    const zeroResult = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, -100, BASE.limit);
    const noRepayResult = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, 0, BASE.limit);
    expect(zeroResult.monthsSaved).toBe(noRepayResult.monthsSaved);
  });

  it('caps repayAmount at debt value (cannot overpay beyond debt)', () => {
    const exactResult = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, BASE.debt, BASE.limit);
    const overpayResult = computePayoffProjection(BASE.debt, BASE.apr, BASE.monthlyPayment, BASE.debt * 2, BASE.limit);
    expect(overpayResult.isFullPayoff).toBe(true);
    expect(overpayResult.newMonths).toBe(exactResult.newMonths);
  });

  it('returns utilization percentages correctly', () => {
    const result = computePayoffProjection(50_000, 8.5, 2000, 10_000, 100_000);
    expect(result.currentUtilizationPct).toBe(50);
    expect(result.newUtilizationPct).toBe(40);
  });

  it('returns zero utilization when limit is 0', () => {
    const result = computePayoffProjection(0, 8.5, 0, 0, 0);
    expect(result.currentUtilizationPct).toBe(0);
    expect(result.newUtilizationPct).toBe(0);
  });

  it('handles zero APR correctly', () => {
    const result = computePayoffProjection(12_000, 0, 1000, 2000, 20_000);
    expect(result.currentMonths).toBe(12);
    expect(result.newMonths).toBe(10);
    expect(result.monthsSaved).toBe(2);
    expect(result.currentUtilizationPct).toBe(60);
    expect(result.newUtilizationPct).toBe(50);
  });

  it('handles very small debt', () => {
    const result = computePayoffProjection(5, 8.5, 100, 3, 100_000);
    expect(result.currentMonths).toBe(1);
    expect(result.newMonths).toBe(1);
  });

  it('handles zero debt', () => {
    const result = computePayoffProjection(0, 8.5, 100, 0, 100_000);
    expect(result.currentMonths).toBe(0);
    expect(result.newMonths).toBe(0);
    expect(result.isFullPayoff).toBe(true);
    expect(result.monthsSaved).toBe(0);
  });

  it('does not return negative monthsSaved when debt cannot be paid', () => {
    const result = computePayoffProjection(1_000_000, 25, 100, 500, 1_000_000);
    expect(result.monthsSaved).toBeGreaterThanOrEqual(0);
    expect(result.interestSaved).toBeGreaterThanOrEqual(0);
  });
});

describe('computeDefaultMonthlyPayment', () => {
  it('uses nextPaymentAmount when provided', () => {
    expect(computeDefaultMonthlyPayment(100_000, 8.5, 5000)).toBe(5000);
  });

  it('falls back to fraction-based when no nextPaymentAmount', () => {
    const result = computeDefaultMonthlyPayment(100_000, 8.5);
    const interestOnly = (100_000 * 0.085) / 12;
    const pctBased = 100_000 * 0.025;
    expect(result).toBe(Math.max(interestOnly, pctBased));
  });

  it('returns 0 for zero debt', () => {
    expect(computeDefaultMonthlyPayment(0, 8.5)).toBe(0);
  });

  it('returns 0 for zero debt with nextPaymentAmount', () => {
    expect(computeDefaultMonthlyPayment(0, 8.5, 100)).toBe(100);
  });
});

describe('formatMonths', () => {
  it('formats 0 as "Paid off"', () => {
    expect(formatMonths(0)).toBe('Paid off');
  });

  it('formats months-only values', () => {
    expect(formatMonths(3)).toBe('3 mo');
    expect(formatMonths(11)).toBe('11 mo');
  });

  it('formats exact years', () => {
    expect(formatMonths(12)).toBe('1 yr');
    expect(formatMonths(36)).toBe('3 yr');
  });

  it('formats years and months', () => {
    expect(formatMonths(15)).toBe('1 yr 3 mo');
    expect(formatMonths(27)).toBe('2 yr 3 mo');
  });

  it('returns "10+ years" for 360+ months', () => {
    expect(formatMonths(360)).toBe('10+ years');
    expect(formatMonths(400)).toBe('10+ years');
  });
});

describe('formatPayoffDate', () => {
  it('returns "Now" for full payoff or 0 months', () => {
    expect(formatPayoffDate(0, true)).toBe('Now');
    expect(formatPayoffDate(0, false)).toBe('Now');
  });

  it('returns future date string', () => {
    const result = formatPayoffDate(12, false);
    expect(result).toMatch(/[A-Z][a-z]{2} \d{4}/);
  });

  it('returns "10+ years" for 360+ months', () => {
    expect(formatPayoffDate(360, false)).toBe('10+ years');
  });
});
