import { useMemo } from 'react';
import { fmt, fmtDate } from '../utils/tokens';
import './AutopaySchedule.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutopayFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface AutopayScheduleProps {
  /** Payment amount per installment, in USD. */
  amount: number;
  /** How often the payment recurs. */
  frequency: AutopayFrequency;
  /** ISO 8601 date string for the first payment. */
  startDate: string;
  /** ISO 8601 date string for the last payment. Omit for open-ended. */
  endDate?: string;
  /** Maximum rows to render (default 8). Prevents an unbounded list. */
  maxRows?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQ_DAYS: Record<AutopayFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 0, // special-cased below
  quarterly: 0, // special-cased below
};

const FREQ_LABEL: Record<AutopayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

/** Advance `date` by one frequency interval, returning a new Date. */
function advanceByFrequency(date: Date, frequency: AutopayFrequency): Date {
  const next = new Date(date);
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'quarterly') {
    next.setMonth(next.getMonth() + 3);
  } else {
    next.setDate(next.getDate() + FREQ_DAYS[frequency]);
  }
  return next;
}

/** Build an ordered list of upcoming payment dates. */
function buildSchedule(
  startDate: string,
  frequency: AutopayFrequency,
  endDate?: string,
  maxRows = 8,
): Date[] {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (isNaN(start.getTime())) return [];

  const dates: Date[] = [];
  let cursor = start;

  while (dates.length < maxRows) {
    if (end && cursor > end) break;
    dates.push(new Date(cursor));
    cursor = advanceByFrequency(cursor, frequency);
  }

  return dates;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AutopaySchedule — live, responsive list preview of upcoming repayment dates.
 *
 * Re-derives the schedule on every render from props, so the preview
 * updates in real-time as the user edits the form above it.
 *
 * Accessibility:
 * - Table is labelled with an `aria-labelledby` heading.
 * - Column headers use `scope="col"` per WCAG technique H63.
 * - "Upcoming" badge uses `aria-label` to give screen readers extra
 *   context (the visual color alone must not be the sole differentiator).
 * - The caption is visually hidden but keeps the table semantically
 *   self-describing when navigated out of context.
 */
export function AutopaySchedule({
  amount,
  frequency,
  startDate,
  endDate,
  maxRows = 8,
}: AutopayScheduleProps) {
  const schedule = useMemo(
    () => buildSchedule(startDate, frequency, endDate, maxRows),
    [startDate, frequency, endDate, maxRows],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPayments = schedule.length;
  const totalAmount = amount * totalPayments;
  const isOpen = !endDate;

  if (!startDate || schedule.length === 0) {
    return (
      <section
        className="autopay-schedule autopay-schedule--empty"
        aria-label="Autopay schedule preview"
      >
        <p className="autopay-schedule__empty-msg">
          Choose a start date and frequency to preview your payment schedule.
        </p>
      </section>
    );
  }

  return (
    <section className="autopay-schedule" aria-labelledby="schedule-heading">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="autopay-schedule__header">
        <h3 id="schedule-heading" className="autopay-schedule__title">
          Payment Schedule Preview
        </h3>
        <span className="autopay-schedule__freq-badge" aria-hidden="true">
          {FREQ_LABEL[frequency]}
        </span>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="autopay-schedule__summary" role="status" aria-live="polite">
        <div className="autopay-schedule__summary-item">
          <span className="autopay-schedule__summary-label">Per payment</span>
          <span className="autopay-schedule__summary-value">{fmt(amount)}</span>
        </div>
        <div className="autopay-schedule__summary-item">
          <span className="autopay-schedule__summary-label">
            Payments shown
          </span>
          <span className="autopay-schedule__summary-value">
            {totalPayments}
            {isOpen && '+'}
          </span>
        </div>
        <div className="autopay-schedule__summary-item">
          <span className="autopay-schedule__summary-label">
            {isOpen ? 'Projected total' : 'Total scheduled'}
          </span>
          <span className="autopay-schedule__summary-value">
            {fmt(totalAmount)}
            {isOpen && '*'}
          </span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="autopay-schedule__table-wrapper" tabIndex={0} aria-label="Scroll to view more payments">
        <table
          className="autopay-schedule__table"
          aria-labelledby="schedule-heading"
        >
          <caption className="sr-only">
            Upcoming autopay payments — {FREQ_LABEL[frequency]}, {fmt(amount)}{' '}
            per payment, starting {fmtDate(startDate)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="autopay-schedule__th autopay-schedule__th--num">
                #
              </th>
              <th scope="col" className="autopay-schedule__th">
                Payment Date
              </th>
              <th scope="col" className="autopay-schedule__th autopay-schedule__th--right">
                Amount
              </th>
              <th scope="col" className="autopay-schedule__th autopay-schedule__th--right">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((date, index) => {
              const dateOnly = new Date(date);
              dateOnly.setHours(0, 0, 0, 0);
              const isUpcoming = dateOnly.getTime() === today.getTime();
              const isPast = dateOnly < today;

              return (
                <tr
                  key={date.toISOString()}
                  className={`autopay-schedule__row${isUpcoming ? ' autopay-schedule__row--upcoming' : ''}${isPast ? ' autopay-schedule__row--past' : ''}`}
                >
                  <td className="autopay-schedule__td autopay-schedule__td--num">
                    {index + 1}
                  </td>
                  <td className="autopay-schedule__td">
                    <time dateTime={date.toISOString().split('T')[0]}>
                      {fmtDate(date.toISOString())}
                    </time>
                  </td>
                  <td className="autopay-schedule__td autopay-schedule__td--right autopay-schedule__td--amount">
                    {fmt(amount)}
                  </td>
                  <td className="autopay-schedule__td autopay-schedule__td--right">
                    {isUpcoming ? (
                      <span
                        className="autopay-schedule__badge autopay-schedule__badge--upcoming"
                        aria-label="Upcoming — next scheduled payment"
                      >
                        Upcoming
                      </span>
                    ) : isPast ? (
                      <span
                        className="autopay-schedule__badge autopay-schedule__badge--past"
                        aria-label="Past payment date"
                      >
                        Past
                      </span>
                    ) : (
                      <span
                        className="autopay-schedule__badge autopay-schedule__badge--scheduled"
                        aria-label="Scheduled"
                      >
                        Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      {isOpen && (
        <p className="autopay-schedule__footnote">
          * Open-ended schedule — showing the first {totalPayments} payments.
          Total will vary.
        </p>
      )}
      {!isOpen && totalPayments === maxRows && (
        <p className="autopay-schedule__footnote">
          Showing first {maxRows} of all scheduled payments.
        </p>
      )}
    </section>
  );
}
