import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats a whole-dollar amount in USD by default', () => {
    expect(formatCurrency(1234)).toBe('$1,234.00');
  });

  it('respects an explicit currency code', () => {
    const result = formatCurrency(1234, 'EUR', 'en-US');
    expect(result).toMatch(/€/);
    expect(result).toContain('1,234');
  });

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatCompactCurrency', () => {
  it('produces a short representation for thousands', () => {
    const result = formatCompactCurrency(1200);
    // Locales differ in exactly how compact units are rendered, but the
    // string must be shorter than the long form.
    expect(result.length).toBeLessThan(formatCurrency(1200).length);
    expect(result).toMatch(/K/i);
  });

  it('produces a short representation for millions', () => {
    const result = formatCompactCurrency(3_400_000);
    expect(result).toMatch(/M/i);
  });
});
