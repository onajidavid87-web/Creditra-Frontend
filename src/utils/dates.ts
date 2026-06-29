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
