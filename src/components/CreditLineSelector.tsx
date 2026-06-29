import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle, ChevronRight } from "lucide-react";
import { formatMoney } from "@/utils/amountValidation";

interface CreditLineSelectorProps {
  /** Credit lines the user is eligible to draw from. */
  creditLines: CreditLine[];
  /**
   * Invoked when the user picks a line. The wizard advances to the
   * amount step on the next render — there is no internal selection
   * state in this component.
   */
  onSelect: (creditLine: CreditLine) => void;
}

/**
 * Step 1 of the draw-credit wizard.
 *
 * Renders the user's credit lines as a list of large click targets. Each
 * row shows the line name, available balance, current utilization, and a
 * "select" affordance. Picking a row calls `onSelect(creditLine)` so the
 * parent wizard can transition to the amount step.
 *
 * Side effects: none. This is a controlled, presentational component —
 * selection state lives in the parent (`DrawCreditPage`).
 *
 * Accessibility:
 * - Rows are real `<button>` elements with a descriptive `aria-label`
 *   (`Select <name> credit line, available balance <fmt>`).
 * - The step heading is exposed via `id="select-credit-line-heading"`
 *   so the parent can wire it as the labelling element for the wizard
 *   container.
 */
export function CreditLineSelector({
  creditLines,
  onSelect,
}: CreditLineSelectorProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-muted">Step 1</p>
        <h2
          id="select-credit-line-heading"
          className="mt-1 text-2xl font-bold text-foreground sm:text-3xl"
        >
          Select Credit Line
        </h2>
        <p className="text-muted mt-2">
          Choose which line of credit to draw from
        </p>
      </div>
      <div className="space-y-3">
        {creditLines.map((line) => (
          <button
            key={line.id}
            onClick={() => onSelect(line)}
            className="group w-full rounded-lg border-2 border-border p-5 text-left transition-all duration-200 hover:border-blue-400 hover:bg-surface hover:shadow-lg hover:shadow-blue-500/20"
            aria-label={`Select ${line.name} credit line, available balance ${formatMoney(line.available)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-3 text-lg font-semibold text-foreground">
                  {line.name}
                </div>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  <div className="text-sm">
                    <span className="block text-muted">Available</span>
                    <span className="mt-1 block font-semibold text-foreground">
                      {formatMoney(line.available)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="block text-muted">Utilization</span>
                    <span className={`mt-1 block font-semibold ${line.utilization > 80 ? "text-yellow-500" : "text-foreground"}`}>
                      {line.utilization}%
                    </span>
                  </div>
                  {line.utilization > 80 && (
                    <div className="flex items-center gap-1 text-sm text-yellow-500" role="status">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span>High utilization</span>
                    </div>
                  )}
                </div>
                <div className="w-full bg-border rounded-full h-2" 
                  role="progressbar" 
                  aria-valuenow={line.utilization} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                  aria-label={`${line.name} utilization percentage`}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${line.utilization > 80 ? "bg-yellow-500" : "bg-blue-500"}`}
                    style={{ width: `${line.utilization}%` }}
                  />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-blue-400 ml-4 shrink-0 mt-1 transition-colors" aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
