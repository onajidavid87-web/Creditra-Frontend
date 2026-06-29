import type { CreditLineStatus } from '../types/creditLine';
import { STATUS_COLOR } from '../utils/tokens';
import './StatusBadge.css';

const STATUS_CUE: Record<CreditLineStatus, string> = {
  Active: 'A',
  Suspended: '!',
  Defaulted: 'X',
  Closed: 'C',
};

interface StatusBadgeProps {
  /** The credit-line lifecycle state to render as a pill. */
  status: CreditLineStatus;
  /** Optional class name appended to the pill — for layout adjustments. */
  className?: string;
}

/**
 * Pill badge for `CreditLineStatus`.
 *
 * Pairs a tinted background with a single-letter glyph (`A`, `!`, `X`,
 * `C`) so meaning is preserved in monochrome screenshots, by colour-blind
 * users, and in forced-colours mode. Colour comes from
 * `STATUS_COLOR[status]` in `src/utils/tokens.ts`; the glyph map is
 * defined locally as `STATUS_CUE`.
 *
 * Accessibility: the component exposes an explicit
 * `aria-label="Credit line status: {status}"` so screen readers
 * announce the state in plain language, not via the glyph alone.
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { bg, color, border } = STATUS_COLOR[status];
  const classes = ['status-badge', className].filter(Boolean).join(' ');
  const cue = STATUS_CUE[status];

  return (
    <span
      className={classes}
      style={{ background: bg, color, borderColor: border }}
      aria-label={`Credit line status: ${status}`}
      title={`Status: ${status}`}
    >
      <span className="status-badge__cue" aria-hidden="true">
        {cue}
      </span>
      <span>{status}</span>
    </span>
  );
}
