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

// ─── Countdown helpers ────────────────────────────────────────────────────────

/**
 * Format a future ISO timestamp as a compact countdown string for inline
 * chips (e.g. "2h 14m", "3d", "45m"). Omits zero-valued units so the
 * label stays short. Falls back to "now" when the target is in the past.
 */
export function formatCountdown(
  targetIso: string | Date,
  now: Date = new Date(),
): string {
  const target = targetIso instanceof Date ? targetIso : new Date(targetIso);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'now';

  const totalSeconds = Math.ceil(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

/**
 * Return a full-sentence accessible label for screen readers describing
 * when the next interest accrual will occur, e.g.
 * "Next interest in 2 hours 14 minutes". Falls back to
 * "Interest is accruing now" for past dates.
 */
export function getCountdownAriaLabel(
  targetIso: string | Date,
  now: Date = new Date(),
  locale: string = DEFAULT_LOCALE,
): string {
  const target = targetIso instanceof Date ? targetIso : new Date(targetIso);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Interest is accruing now';
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const totalSeconds = Math.ceil(diffMs / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, secondsPerUnit] of units) {
    const value = Math.floor(totalSeconds / secondsPerUnit);
    if (value > 0 || unit === 'minute') {
      const formatted = rtf.format(value, unit);
      const cleaned = formatted.replace(/^in\s+/, '');
      return `Next interest in ${cleaned}`;
    }
  }

  return `Next interest in ${rtf.format(0, 'second')}`;
}
