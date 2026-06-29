"use client";

/**
 * DrawSummaryBar — persistent bottom summary bar for the Draw Credit wizard.
 *
 * Renders three stat tiles (Amount, APR, Total Cost) anchored to the bottom
 * of the viewport so the user always knows what they are about to draw,
 * regardless of which step of the wizard they are on.
 *
 * Visibility
 * ──────────
 * The bar is shown only on the `amount` step. The early-wizard `select`
 * step is excluded (no line has been chosen yet, so there is no data to
 * summarise) and the terminal `status` step is excluded (the
 * success/error screen replaces the wizard entirely). The `confirm` step
 * is also excluded: the `ConfirmationStep` card already surfaces the
 * same figures inline and stacks its own sticky action bar (Cancel /
 * Back / Draw). Showing the page-level summary bar on top of that
 * action bar would create two stacked sticky strips at the bottom of
 * the viewport, obscuring the primary actions.
 *
 * Layout
 * ──────
 * The element uses `position: fixed` so it stays anchored to the viewport
 * bottom as the user scrolls through any of the step cards. See
 * `DrawSummaryBar.css` for the mobile safe-area inset. Parent components
 * must add bottom padding to their scroll container so the bar does not
 * occlude content (see the `pb-…` classes applied on `DrawCreditPage`).
 *
 * Accessibility
 * ─────────────
 * - `role="region"` + `aria-label="Draw summary"` so screen-reader users
 *   can navigate to it as a landmark.
 * - Each tile is a definition-list pair (`<dl>`) so SR users hear the
 *   label/value relationship explicitly.
 * - A screen-reader-only `aria-live="polite"` region announces the
 *   full summary in human-readable form, debounced via
 *   `useDebounceValue` so rapid amount edits (`100` → `1000` →
 *   `10000`) are not spammed to the SR user. Polite live regions wait
 *   for the SR to be idle, so the trailing-edge debounce gives a
 *   single coherent announcement.
 *
 * Theme awareness
 * ───────────────
 * Every visible style references CSS custom properties defined in
 * `src/index.css` (`--surface-overlay`, `--border`, `--text`,
 * `--muted`, `--accent`). Overrides for `[data-contrast="high"]` are
 * already declared on those tokens, so the bar auto-adapts to the
 * high-contrast toggle without any JS branching.
 */

import { CreditLine, DrawStep } from "@/types/draw-credit.types";
import { getDrawPricingQuote } from "@/lib/draw-credit-pricing";
import { formatMoney } from "@/utils/amountValidation";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import "./DrawSummaryBar.css";

interface DrawSummaryBarProps {
  /** Selected credit line. When null, the bar renders nothing. */
  creditLine: CreditLine | null;
  /** Current draw amount in whole dollars. Negative values are clamped to 0. */
  amount: number;
  /** Current wizard step — controls visibility. */
  step: DrawStep;
}

/**
 * Steps on which the summary bar should be visible. Intentionally a
 * module-level constant so the set of visible steps is easy to audit in
 * one place. `confirm` is intentionally absent — see the Visibility
 * section of the file header for the rationale (avoid overlapping with
 * `ConfirmationStep`'s own sticky action bar).
 */
const VISIBLE_STEPS: ReadonlySet<DrawStep> = new Set<DrawStep>(["amount"]);

/** Synthetic quote used to keep hooks stable when the bar is invisible. */
const HIDDEN_QUOTE = { apr: 0, fee: 0 };

/**
 * Builds a one-sentence summary used by the screen-reader live region.
 *
 * Kept in plain English rather than a digit-stream so the user hears a
 * meaningful statement ("Draw ten thousand dollars at 11.5% APR.
 * Total cost ten thousand one hundred dollars.") instead of a row of
 * numbers.
 */
function buildAnnouncement(
  amountText: string,
  apr: number,
  totalCostText: string,
): string {
  return `Draw summary: ${amountText} draw amount, ${apr} percent APR, total cost ${totalCostText}.`;
}

/**
 * Derived summary tuple — factored out so the debounce hook and the
 * render path use the *exact* same numbers, preventing a one-frame
 * drift between the visible tiles and the screen-reader announcement.
 */
function computeSummary(
  line: CreditLine,
  amount: number,
): {
  apr: number;
  fee: number;
  totalCost: number;
  amountText: string;
  totalCostText: string;
  announcement: string;
} {
  // Defensive clamp: the input layer already enforces >= 0, but we guard
  // here so a wild prop value cannot blow up the live-region text or the
  // money formatter.
  const safeAmount = Math.max(amount, 0);
  const { apr, fee } = getDrawPricingQuote(line, safeAmount);
  // Total cost = principal + 1 % flat fee. Interest is intentionally NOT
  // bundled in: it varies with repayment schedule and adding it would
  // mislead users about the *committed* cost of the draw.
  const totalCost = safeAmount + fee;
  const amountText = formatMoney(safeAmount);
  const totalCostText = formatMoney(totalCost);
  const announcement = buildAnnouncement(amountText, apr, totalCostText);
  return { apr, fee, totalCost, amountText, totalCostText, announcement };
}

export function DrawSummaryBar({
  creditLine,
  amount,
  step,
}: DrawSummaryBarProps) {
  // The bar is purely informational — bail out early on the steps where
  // it would be confusing (no line yet, status screen, or confirm step
  // already has its own sticky bar).
  const isVisible = !!creditLine && VISIBLE_STEPS.has(step);

  /*
   * Hooks order rule
   * ────────────────
   * `useDebounceValue` MUST be called on every render so React's
   * per-instance hooks array stays the same length across renders.
   * We therefore compute the announcement string before the early
   * return and feed the debounce hook even when the bar is invisible
   * (passing an empty string). The early return short-circuits the
   * render so the live region is never in the DOM in that branch.
   *
   * Computing the summary in one place also guarantees the visible
   * tiles and the live-region text can never drift apart.
   */
  const summary = isVisible && creditLine
    ? computeSummary(creditLine, amount)
    : null;
  const announcement = summary ? summary.announcement : "";

  // 400 ms debounce so SR users don't get a flood of partial
  // announcements as they type digits into the amount field. Short
  // enough to feel responsive but long enough to coalesce
  // "10" → "100" → "1000" into one readback.
  const debouncedAnnouncement = useDebounceValue(announcement, 400);

  if (!isVisible || !summary) {
    return null;
  }

  const { apr, amountText, totalCostText } = summary;

  return (
    <aside
      className="draw-summary-bar"
      role="region"
      aria-label="Draw summary"
      data-step={step}
      data-testid="draw-summary-bar"
    >
      <div className="draw-summary-bar__inner">
        <dl className="draw-summary-bar__tiles">
          <div
            className="draw-summary-bar__tile"
            data-tile="amount"
            data-testid="draw-summary-tile-amount"
          >
            <dt className="draw-summary-bar__caption">Amount</dt>
            <dd
              className="draw-summary-bar__value num-tabular"
              data-testid="draw-summary-amount"
            >
              {amountText}
            </dd>
          </div>
          <div
            className="draw-summary-bar__tile"
            data-tile="apr"
            data-testid="draw-summary-tile-apr"
          >
            <dt className="draw-summary-bar__caption">APR</dt>
            <dd
              className="draw-summary-bar__value num-tabular"
              data-testid="draw-summary-apr"
            >
              {apr}%
            </dd>
          </div>
          <div
            className="draw-summary-bar__tile"
            data-tile="total"
            data-testid="draw-summary-tile-total"
          >
            <dt className="draw-summary-bar__caption">Total cost</dt>
            <dd
              className="draw-summary-bar__value num-tabular"
              data-testid="draw-summary-total"
            >
              {totalCostText}
            </dd>
          </div>
        </dl>
      </div>

      {/*
        Screen-reader-only polite live region announcing the *debounced*
        summary. The element's text content only changes once typing has
        settled, so a single coherent sentence is readback per change
        rather than a stream of intermediate values. aria-atomic ensures
        the entire string is read (not just the changed suffix).
      */}
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="draw-summary-live"
      >
        {debouncedAnnouncement}
      </span>
    </aside>
  );
}

export default DrawSummaryBar;
