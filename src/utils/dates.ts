/**
 * Small, dependency-free date helpers.
 *
 * We deliberately avoid pulling in moment / dayjs / luxon — the few
 * formatting needs across the app can be served by `Intl.*` plus the
 * helpers here.
 */

const DEFAULT_LOCALE = 'en-US';

/**
 * Return a human-friendly "time ago" string (e.g. `"3 minutes ago"`,
 * `"2 days ago"`). Uses the browser's `Intl.RelativeTimeFormat` where
 * available.
 */
export function timeAgo(
  iso: string | Date,
  now: Date = new Date(),
  locale: string = DEFAULT_LOCALE,
): string {
  const then = iso instanceof Date ? iso : new Date(iso);
  const diffSeconds = Math.round((then.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, secondsPerUnit] of units) {
    if (absSeconds >= secondsPerUnit || unit === 'second') {
      const value = Math.round(diffSeconds / secondsPerUnit);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Return `true` when the given ISO timestamp falls on the same calendar
 * day as `reference` (defaults to today).
 */
export function isSameDay(iso: string | Date, reference: Date = new Date()): boolean {
  const date = iso instanceof Date ? iso : new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function startOfDay(reference: Date = new Date()): Date {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(reference: Date = new Date()): Date {
  const date = new Date(reference);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function startOfWeek(reference: Date = new Date()): Date {
  const date = startOfDay(reference);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export function endOfWeek(reference: Date = new Date()): Date {
  const date = startOfWeek(reference);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
}

export function startOfMonth(reference: Date = new Date()): Date {
  const date = startOfDay(reference);
  date.setDate(1);
  return date;
}

export function endOfMonth(reference: Date = new Date()): Date {
  const date = startOfMonth(reference);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return endOfDay(date);
}

/**
 * Return a locale-aware relative label for a past timestamp.
 *
 * Examples:
 *   – just now          (< 10 s ago)
 *   – 3 minutes ago
 *   – 2 hours ago
 *   – yesterday
 *   – Jun 12            (same year, > 1 day)
 *   – Jun 12, 2024      (different year)
 *
 * Uses `Intl.RelativeTimeFormat` for the short-range cases and
 * `Intl.DateTimeFormat` for anything older than 24 h, so the string
 * is always locale-correct without a third-party library.
 */
export function formatRelative(
  ts: Date | string | number,
  now: Date = new Date(),
  locale: string = DEFAULT_LOCALE,
): string {
  const then = ts instanceof Date ? ts : new Date(ts);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 10) return 'just now';

  if (diffSec < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      -diffSec,
      'second',
    );
  }

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      -diffMin,
      'minute',
    );
  }

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      -diffHr,
      'hour',
    );
  }

  if (diffHr < 48) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      -1,
      'day',
    );
  }

  // Older than 48 h → absolute date
  const sameYear = then.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(then);
}
