// src/utils/dates.ts
/**
 * Utility functions for date formatting.
 * Provides a simple `formatRelative` function to display a relative time string
 * such as "2 minutes ago" or "in 5 seconds".
 * Uses the native `Intl.RelativeTimeFormat` for broad browser support without
 * adding extra dependencies.
 */

export const formatRelative = (date: Date | string | number): string => {
  const target = new Date(date);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const thresholds: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'seconds'],
    [60 * 60, 'minutes'],
    [60 * 60 * 24, 'hours'],
    [60 * 60 * 24 * 30, 'days'],
    [60 * 60 * 24 * 365, 'months'],
    [Infinity, 'years'],
  ];

  let value = diffSec;
  let unit: Intl.RelativeTimeFormatUnit = 'seconds';

  for (let i = 0; i < thresholds.length; i++) {
    const [limit, u] = thresholds[i];
    if (Math.abs(value) < limit) {
      unit = u;
      break;
    }
    value = Math.round(value / limit);
  }

  return rtf.format(value, unit);
};
