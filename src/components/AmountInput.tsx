import { CreditLine } from "@/types/draw-credit.types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  formatMoney,
  getDrawAmountValidation,
} from "../utils/amountValidation";
import { FormMessage } from "./FormMessage";

const STEP_AMOUNT = 100;

const stepClasses =
  "flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background/60 text-foreground hover:bg-surface hover:border-accent/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed";

const STEP_ICON_CLASS = "h-4 w-4";

interface AmountInputProps {
  creditLine: CreditLine;
  onAmountChange: (amount: number) => void;
  onNext: (amount: number) => void;
  onBack: () => void;
}

export function AmountInput({
  creditLine,
  onAmountChange,
  onNext,
  onBack,
}: AmountInputProps) {
  const [amount, setAmount] = useState("");
  const inputId = "draw-amount-input";
  const helperId = "draw-amount-helper";
  const errorId = "draw-amount-error";
  const constraintsId = "draw-amount-constraints";
  const statusId = "draw-amount-status";

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    onAmountChange(numAmount);
  }, [amount, onAmountChange]);

  const handleStep = useCallback(
    (direction: "up" | "down") => {
      setAmount((prev) => {
        const current = parseFloat(prev) || 0;
        const next = direction === "up"
          ? Math.min(current + STEP_AMOUNT, creditLine.available)
          : Math.max(current - STEP_AMOUNT, 0);
        return next.toString();
      });
    },
    [creditLine.available],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleStep("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleStep("down");
      }
    },
    [handleStep],
  );

  const handlePreset = (percent: number) => {
    const preset = Math.floor((creditLine.available * percent) / 100);
    setAmount(preset.toString());
  };

  const numAmount = parseFloat(amount) || 0;
  const validation = getDrawAmountValidation(amount, creditLine);
  const toneBySeverity = {
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-400/30",
      text: "text-blue-100",
      icon: <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />,
      input: "border-border focus-within:border-blue-400",
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-400/30",
      text: "text-emerald-100",
      icon: <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />,
      input: "border-emerald-400/60",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-400/30",
      text: "text-amber-100",
      icon: <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />,
      input: "border-amber-400/60",
    },
    danger: {
      bg: "bg-red-500/10",
      border: "border-red-400/30",
      text: "text-red-100",
      icon: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />,
      input: "border-red-400/70",
    },
  };
  const currentTone = toneBySeverity[validation.feedback.severity];
  const inputStateClassName = currentTone.input;
  const hasError = validation.feedback.severity === "danger";
  const isValid = validation.isValid;
  const handleMaxClick = () => handlePreset(100);
  const getMessageType = () => validation.feedback.severity;
  const describedBy = `${helperId} ${constraintsId} ${statusId}${hasError ? ` ${errorId}` : ""}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Enter Amount</h2>
        <p className="text-muted mt-2">{creditLine.name}</p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          Draw amount
          <span className="text-error ml-1" aria-label="required">
            *
          </span>
        </label>

        {/* Helper text explaining the input */}
        <p id={helperId} className="text-sm text-muted">
          Enter the amount you wish to draw from your available credit.
          Available limit:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(creditLine.available)}
          </span>
        </p>

        {/* Input field with border styling based on validation state */}
        <div
          className={`flex items-center gap-2 bg-surface p-4 rounded-xl border-2 overflow-hidden transition-colors ${inputStateClassName}`}
        >
          <button
            onClick={() => handleStep("down")}
            disabled={numAmount <= 0}
            className={stepClasses}
            aria-label="Decrease amount"
            type="button"
          >
            <ChevronDown className={STEP_ICON_CLASS} aria-hidden="true" />
          </button>
          <span
            className="text-3xl font-bold text-foreground flex-shrink-0"
            aria-hidden="true"
          >
            $
          </span>
          <input
            id={inputId}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-2xl font-bold bg-transparent outline-none flex-1 text-foreground placeholder:text-muted/50 min-w-0 tabular-nums"
            min={validation.minAmount}
            max={creditLine.available}
            step={STEP_AMOUNT}
            required
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required="true"
          />
          <button
            onClick={() => handleStep("up")}
            disabled={numAmount >= creditLine.available}
            className={stepClasses}
            aria-label="Increase amount"
            type="button"
          >
            <ChevronUp className={STEP_ICON_CLASS} aria-hidden="true" />
          </button>
          {/* Max button for quick-fill with accessible label */}
          <button
            onClick={handleMaxClick}
            className="px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface flex-shrink-0"
            aria-label="Set amount to maximum available credit"
            type="button"
          >
            Max
          </button>
        </div>

        {/* Constraint boxes showing min, available, and reserve */}
        <div id={constraintsId} className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Minimum draw
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatMoney(validation.minAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Available credit
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatMoney(validation.maxAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Reserve
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatMoney(validation.recommendedReserve)}
            </p>
          </div>
        </div>

        {/* Inline validation message - displayed only when there's content */}
        <FormMessage
          id={errorId}
          title={validation.feedback.title}
          message={validation.feedback.message}
          type={getMessageType()}
          tone="inline"
          reserveSpace={true}
          minHeight={60}
        />
      </div>

      {/* Quick presets for percentage-based amounts */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">
          Quick amount
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() =>
                setAmount(
                  Math.floor((creditLine.available * percent) / 100).toString(),
                )
              }
              className="py-2 px-3 border-2 border-border rounded-lg hover:border-blue-400 hover:bg-surface hover:shadow-md hover:shadow-blue-500/20 transition-all text-foreground font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`Set amount to ${percent} percent of available credit`}
              type="button"
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Summary display showing available, requested, and remaining */}
      <div className="bg-surface p-5 rounded-xl border border-border space-y-3 shadow-lg shadow-blue-500/5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Available:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(creditLine.available)}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-3">
          <span className="text-muted">Requested:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(numAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-3">
          <span className="text-muted">Remaining credit:</span>
          <span
            className={`font-semibold tabular-nums ${validation.remainingCredit < validation.recommendedReserve && numAmount > 0 ? "text-amber-400" : "text-foreground"}`}
          >
            {formatMoney(validation.remainingCredit)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 border-2 border-border text-foreground rounded-lg hover:bg-surface transition-colors font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="button"
        >
          Back
        </button>
        <button
          onClick={() => onNext(numAmount)}
          disabled={!isValid}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
