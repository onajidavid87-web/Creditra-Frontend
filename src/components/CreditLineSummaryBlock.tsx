import { CreditLine } from "@/types/draw-credit.types";
import { formatMoney } from "@/utils/amountValidation";

interface CreditLineSummaryBlockProps {
  /** Credit line being summarised. */
  creditLine: CreditLine;
  /**
   * Optional pending draw amount. When supplied, the summary highlights
   * the projected utilised/available balances *after* the draw so the
   * user can compare before-vs-after at a glance. Defaults to 0.
   */
  amount?: number;
}

/**
 * Compact, reusable summary card for a single credit line.
 *
 * Used inside the draw wizard's confirmation step and in the credit-line
 * dashboard tiles. Surfaces three numbers — limit, utilised, available —
 * plus the projected post-draw values when `amount > 0`. All values are
 * formatted through `formatMoney` so locale and currency are consistent
 * with the rest of the app.
 *
 * Purely presentational. No side effects, no state.
 */
export function CreditLineSummaryBlock({
  creditLine,
  amount = 0,
}: CreditLineSummaryBlockProps) {
  const utilized = creditLine.limit - creditLine.available;
  const safeAmount = Math.max(amount, 0);
  const projectedUtilized = utilized + safeAmount;
  const projectedAvailable = Math.max(creditLine.available - safeAmount, 0);

  return (
    <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Credit Summary
        </h3>
        <p className="text-xs text-muted mt-1">{creditLine.name}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-muted">Limit</p>
          <p className="text-base font-semibold text-foreground mt-1">
            {formatMoney(creditLine.limit)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-muted">Utilized</p>
          <p className="text-base font-semibold text-foreground mt-1">
            {formatMoney(projectedUtilized)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-muted">Available</p>
          <p className="text-base font-semibold text-foreground mt-1">
            {formatMoney(projectedAvailable)}
          </p>
        </div>
      </div>
    </section>
  );
}
