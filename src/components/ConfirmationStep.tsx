import { AccessibleTooltip } from "@/components/AccessibleTooltip";
import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { CreditLineSummaryBlock } from "@/components/CreditLineSummaryBlock";
import { PendingButton } from "@/components/PendingButton";
import { formatMoney } from "@/utils/amountValidation";
import { useWallet } from "@/context/WalletContext";

interface ConfirmationStepProps {
  /** The credit line the user is drawing from. */
  creditLine: CreditLine;
  /** Whole-USD draw amount the user entered in step 2. */
  amount: number;
  /**
   * Invoked when the user agrees to terms and presses the primary action.
   * The parent wizard handles network submission and step transition.
   */
  onConfirm: () => void;
  /** Return to the previous (preview) step without losing context. */
  onBack: () => void;
  /** Exit the wizard entirely. */
  onCancel: () => void;
  /**
   * When true, the primary button shows the `PendingButton` spinner and is
   * disabled to prevent double-submission. Driven by the parent's
   * network request state.
   */
  isLoading?: boolean;
}

/**
 * Step 4 of the draw-credit wizard: final confirmation.
 *
 * Surfaces the unambiguous numbers (draw amount, fee, post-draw utilization,
 * APR) alongside a "I agree to the terms" checkbox. The primary action is
 * disabled until the checkbox is ticked — see UX_RATIONALE.md
 * "Repayment uses a confirmation modal" for the irreversible-action policy
 * this enforces.
 *
 * Local state: `agreedToTerms` (checkbox). All other state lives in the
 * parent wizard.
 *
 * Accessibility: the primary button uses `PendingButton`, which sets
 * `aria-busy="true"` and disables the button while `isLoading`. The
 * checkbox is a native input so it inherits keyboard semantics.
 */
export function ConfirmationStep({
  creditLine,
  amount,
  onConfirm,
  onBack,
  onCancel,
  isLoading = false,
}: ConfirmationStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { status } = useWallet();
  const utilizedBalance = creditLine.limit - creditLine.available;
  const safeAmount = Math.max(amount, 0);
  const { fee, apr, estimatedMonthlyInterest, riskBand, termMonths } =
    getDrawPricingQuote(creditLine, safeAmount);
  const newBalance = utilizedBalance + safeAmount + fee;
  const remainingAvailable = Math.max(creditLine.limit - newBalance, 0);
  const newUtilization = Math.round((newBalance / creditLine.limit) * 100);
  const isDrawDisabled = !agreedToTerms || isLoading;
  const disabledHelperText = !agreedToTerms
    ? "Accept the authorization terms to enable the Draw button."
    : "Submitting your draw request. Please wait.";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-muted">Step 4</p>
        <h2
          id="confirm-draw-heading"
          className="mt-1 text-2xl font-bold text-foreground sm:text-3xl"
        >
          Review and confirm
        </h2>
        <p className="text-muted mt-2">
          Confirm your draw details before submitting.
        </p>
      </div>

      <CreditLineSummaryBlock creditLine={creditLine} amount={amount} />

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-sm text-muted font-medium">Draw amount</p>
              <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                {formatMoney(safeAmount)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">Estimated fee</p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(fee)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">
                Estimated monthly interest
              </p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(estimatedMonthlyInterest)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">New balance</p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(newBalance)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">
                Available after draw
              </p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(remainingAvailable)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted font-medium">
                {/* MICROCOPY.md: Utilization */}
                <AccessibleTooltip label="Utilization is the percentage of your available credit that is currently being used.">
                  <span>Current utilization</span>
                </AccessibleTooltip>
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {creditLine.utilization}%
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted font-medium">After draw</span>
              <span
                className={`font-semibold tabular-nums ${newUtilization > 80 ? "text-yellow-500" : "text-foreground"}`}
              >
                {newUtilization}%
              </span>
            </div>
          </div>
          {newUtilization > 80 && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-500">
                  High Utilization Warning
                </p>
                <p className="text-sm text-yellow-500 mt-1">
                  Your credit utilization will exceed 80%. This may impact your
                  credit terms.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-border">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 w-5 h-5 rounded accent-accent"
        />
        <span className="text-sm text-foreground">
          I agree to the
          {' '}
          {/* MICROCOPY.md: Term */}
          <AccessibleTooltip label="A term is a defined period or condition of your credit agreement.">
            <span>terms</span>
          </AccessibleTooltip>
          {' '}
          and conditions and authorize this draw. The funds will be deposited
          within 1-2 business days.
        </span>
      </label>

      {status === 'connected' && !isLoading && (
        <div 
          className="flex items-start gap-3 rounded-lg border p-4"
          style={{
            backgroundColor: 'rgba(88,166,255,0.08)',
            borderColor: 'rgba(88,166,255,0.3)',
          }}
          role="status"
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#58a6ff' }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: '#e6edf3' }}>
            Your wallet will ask you to sign next
          </span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border-2 border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-background disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="rounded-lg border-2 border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-background disabled:opacity-50 sm:w-auto"
          >
            Back
          </button>
          <div className="space-y-2 sm:ml-auto sm:min-w-64">
            <PendingButton
              type="button"
              onClick={onConfirm}
              pending={isLoading}
              pendingLabel="Processing draw..."
              disabled={isDrawDisabled}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              aria-describedby={
                isDrawDisabled ? "draw-disabled-helper" : undefined
              }
            >
              Draw
            </PendingButton>
            {isDrawDisabled && (
              <p
                id="draw-disabled-helper"
                className="text-center text-xs text-muted sm:text-right"
                role="status"
              >
                {disabledHelperText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
