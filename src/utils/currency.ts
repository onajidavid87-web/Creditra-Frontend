/**
 * Lightweight currency formatting helpers.
 *
 * These are kept separate from `tokens.ts` so that non-UI modules can pull
 * formatting helpers without dragging in design-token CSS values.
 */

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';

/**
 * Format a number as a localized currency string.
 *
 * @param amount   - The numeric amount to format.
 * @param currency - ISO 4217 currency code. Defaults to USD.
 * @param locale   - BCP 47 locale string. Defaults to en-US.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a compact currency string (e.g. `$1.2K`, `$3.4M`).
 *
 * Useful for chart axis labels and dashboard summary tiles where space is
 * constrained.
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}
