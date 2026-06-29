import { describe, it, expect } from 'vitest';
import { timeAgo, isSameDay } from './dates';

describe('timeAgo', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  it('reports very recent times in seconds', () => {
    const tenSecondsAgo = new Date(NOW.getTime() - 10_000);
    expect(timeAgo(tenSecondsAgo, NOW)).toMatch(/second/);
  });

  it('reports minute-level differences in minutes', () => {
    const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60_000);
    expect(timeAgo(fiveMinutesAgo, NOW)).toMatch(/minute/);
  });

  it('reports day-level differences in days', () => {
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60_000);
    expect(timeAgo(threeDaysAgo, NOW)).toMatch(/day/);
  });

  it('handles future times', () => {
    const inOneHour = new Date(NOW.getTime() + 60 * 60_000);
    const result = timeAgo(inOneHour, NOW);
    expect(result).toMatch(/hour/);
  });
});

describe('isSameDay', () => {
  it('returns true for two times on the same calendar day', () => {
    const morning = new Date('2025-01-15T03:00:00');
    const evening = new Date('2025-01-15T22:00:00');
    expect(isSameDay(morning, evening)).toBe(true);
  });

  it('returns false for two times on different calendar days', () => {
    const day1 = new Date('2025-01-15T23:30:00');
    const day2 = new Date('2025-01-16T00:30:00');
    expect(isSameDay(day1, day2)).toBe(false);
  });
});
