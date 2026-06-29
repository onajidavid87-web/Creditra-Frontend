import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { PayoffProjection } from '@/components/PayoffProjection';
import { RepaymentVisualizer } from '@/components/RepaymentVisualizer';
import { InlineHelpOverlay } from '@/components/InlineHelpOverlay';
import { formatMoney, getRepayAmountValidation, requiresRepayConfirmation } from '@/utils/amountValidation';
import {
  TypedAmountConfirmField,
  isTypedAmountMatch,
} from '@/components/TypedAmountConfirm';
import type { CreditLine } from '@/types/creditLine';
import { MOCK_CREDIT_LINES } from '@/data/mockData';

type RepayStep = 'input' | 'review' | 'success';

const SEVERITY_CONFIG = {
  info: {
    border: 'rgba(88,166,255,0.25)',
    bg: 'rgba(88,166,255,0.08)',
    color: 'var(--accent, #58a6ff)',
    icon: <Info size={16} aria-hidden="true" />,
  },
  success: {
    border: 'rgba(63,185,80,0.25)',
    bg: 'rgba(63,185,80,0.08)',
    color: 'var(--success, #3fb950)',
    icon: <CheckCircle size={16} aria-hidden="true" />,
  },
  warning: {
    border: 'rgba(210,153,34,0.25)',
    bg: 'rgba(210,153,34,0.08)',
    color: 'var(--warning, #d29922)',
    icon: <AlertTriangle size={16} aria-hidden="true" />,
  },
  danger: {
    border: 'rgba(248,81,73,0.25)',
    bg: 'rgba(248,81,73,0.08)',
    color: 'var(--error, #f85149)',
    icon: <AlertCircle size={16} aria-hidden="true" />,
  },
} as const;

export default function RepayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('line');

  const [step, setStep] = useState<RepayStep>('input');
  const [selectedId, setSelectedId] = useState<string>(preselectedId ?? '');
  const [amountStr, setAmountStr] = useState('');
  const [confirmAmountStr, setConfirmAmountStr] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

  const creditLines = useMemo(
    () => MOCK_CREDIT_LINES.filter((cl) => cl.status === 'Active' && cl.utilized > 0),
    [],
  );

  const selectedLine = useMemo(
    () => MOCK_CREDIT_LINES.find((cl) => cl.id === selectedId) ?? null,
    [selectedId],
  );

  const walletBalance = 50000;

  const validation = useMemo(
    () =>
      selectedLine
        ? getRepayAmountValidation(amountStr, selectedLine.utilized, walletBalance)
        : null,
    [amountStr, selectedLine, walletBalance],
  );

  const amount = validation?.amount ?? 0;
  const isInvalid = !validation?.isValid;
  const needsConfirm = requiresRepayConfirmation(amount);
  const isConfirmDisabled = needsConfirm && !isTypedAmountMatch(confirmAmountStr, amount);

  const activeTone = validation
    ? SEVERITY_CONFIG[validation.feedback.severity]
    : SEVERITY_CONFIG.info;

  const handlePercent = (pct: number) => {
    if (!validation) return;
    let target = (validation.maxRepayAmount * pct) / 100;
    if (target > walletBalance) target = walletBalance;
    setAmountStr(target.toFixed(2));
  };

  const handleReview = () => {
    if (!isInvalid && amount > 0) {
      setConfirmAmountStr('');
      setStep('review');
    }
  };

  const handleConfirm = () => {
    setStep('success');
  };

  const handleNewRepay = () => {
    setAmountStr('');
    setStep('input');
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('input');
    } else if (!preselectedId) {
      setSelectedId('');
    } else {
      navigate(-1);
    }
  };

  if (!selectedLine) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <header>
          <p className="text-xs font-semibold uppercase text-muted">Repay Credit</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Select a credit line to repay
          </h1>
        </header>

        <div className="space-y-3">
          {creditLines.map((cl) => {
            const utilization = Math.round((cl.utilized / cl.limit) * 100);
            return (
              <button
                key={cl.id}
                type="button"
                onClick={() => setSelectedId(cl.id)}
                className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-accent hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{cl.name}</p>
                    <p className="mt-0.5 text-sm text-muted">{cl.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatMoney(cl.utilized)}
                    </p>
                    <p className="text-sm text-muted">{utilization}% utilized</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${
                      utilization > 80
                        ? 'bg-red-500'
                        : utilization > 50
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {creditLines.length === 0 && (
          <p className="text-center text-muted">
            No active credit lines with outstanding debt to repay.
          </p>
        )}
      </div>
    );
  }

  const oldPct = Math.round((selectedLine.utilized / selectedLine.limit) * 100);
  const remainingDebt = validation?.remainingDebt ?? selectedLine.utilized;
  const newPct = Math.round((remainingDebt / selectedLine.limit) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {step === 'input' ? 'Back to credit lines' : 'Back to input'}
      </button>

      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted">
            {step === 'success' ? 'Repayment Complete' : 'Repay Credit'}
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {step === 'success'
              ? 'Payment successful!'
              : step === 'review'
                ? 'Review your repayment'
                : 'Make a repayment'}
          </h1>
          {step !== 'success' && (
            <p className="text-sm text-muted">
              {selectedLine.name} &middot; {selectedLine.apr}% APR
            </p>
          )}
        </header>

        {step === 'input' && (
          <>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase text-muted">
                Current debt
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {formatMoney(selectedLine.utilized)}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${
                    oldPct > 80
                      ? 'bg-red-500'
                      : oldPct > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${oldPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {oldPct}% of {formatMoney(selectedLine.limit)} limit
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="repay-amount"
                      className="text-sm font-semibold text-foreground"
                    >
                      Amount to repay
                    </label>
                    <span className="text-xs text-muted">
                      Wallet: {formatMoney(walletBalance)}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercent(pct)}
                        className="flex-1 rounded-md border border-accent/30 px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        aria-label={`Set amount to ${pct === 100 ? 'maximum' : `${pct} percent`}`}
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-3">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted"
                      aria-hidden="true"
                    >
                      $
                    </span>
                    <input
                      id="repay-amount"
                      type="number"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0.00"
                      min={1}
                      step={0.01}
                      aria-invalid={validation?.feedback.severity === 'danger' || undefined}
                      className="w-full rounded-lg border bg-background px-3 py-3 pl-8 text-lg font-semibold text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent"
                      style={{
                        borderColor:
                          validation?.feedback.severity === 'danger'
                            ? 'var(--error, #f85149)'
                            : validation?.feedback.severity === 'warning'
                              ? 'var(--warning, #d29922)'
                              : amount > 0
                                ? 'var(--accent, #58a6ff)'
                                : 'var(--border, #30363d)',
                      }}
                    />
                  </div>

                  <div
                    className="mt-3 flex items-start gap-2 rounded-lg p-3 text-sm"
                    style={{
                      border: `1px solid ${activeTone.border}`,
                      background: activeTone.bg,
                      color: activeTone.color,
                    }}
                    role={validation?.feedback.severity === 'danger' ? 'alert' : 'status'}
                    aria-live="polite"
                  >
                    <span className="mt-0.5 inline-flex shrink-0">
                      {activeTone.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {validation?.feedback.title ?? ''}
                      </p>
                      <p className="mt-0.5 text-xs opacity-80">
                        {validation?.feedback.message ?? ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase text-muted">
                    Preview
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Remaining debt</span>
                      <span
                        className={`font-semibold ${
                          amount > 0 && remainingDebt === 0
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {formatMoney(remainingDebt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">New utilization</span>
                      <span className="font-semibold text-foreground">
                        {newPct}%
                        <span className="ml-1.5 text-muted line-through">
                          {oldPct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-red-500/30 transition-all"
                        style={{ width: `${oldPct}%` }}
                      />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all ${
                          remainingDebt === 0 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${newPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={isInvalid || amount <= 0}
                    className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Review Repayment
                  </button>
                </div>
              </div>

              <aside className="lg:sticky lg:top-6">
                <PayoffProjection
                  currentDebt={selectedLine.utilized}
                  apr={selectedLine.apr}
                  repayAmount={amount}
                  limit={selectedLine.limit}
                  nextPaymentAmount={selectedLine.nextPaymentAmount}
                />
              </aside>
            </div>

            <RepaymentVisualizer
              principal={selectedLine.utilized}
              apr={selectedLine.apr}
              monthlyPayment={
                selectedLine.nextPaymentAmount ??
                Math.max(
                  selectedLine.utilized * 0.025,
                  selectedLine.utilized * (selectedLine.apr / 100 / 12),
                )
              }
            />

            <div className="flex items-center justify-between">
              <button
                ref={helpTriggerRef}
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-sm font-semibold text-blue-300 underline-offset-4 transition-colors hover:text-blue-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                I need help
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted">You are about to repay</p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {formatMoney(amount)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Remaining debt after</span>
                  <span
                    className={`font-semibold ${
                      remainingDebt === 0 ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {formatMoney(remainingDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Wallet balance</span>
                  <span className="font-semibold text-success">
                    {formatMoney(walletBalance)}
                  </span>
                </div>
              </div>
            </div>

            <PayoffProjection
              currentDebt={selectedLine.utilized}
              apr={selectedLine.apr}
              repayAmount={amount}
              limit={selectedLine.limit}
              nextPaymentAmount={selectedLine.nextPaymentAmount}
            />

            {needsConfirm && (
              <TypedAmountConfirmField
                amount={amount}
                value={confirmAmountStr}
                onChange={setConfirmAmountStr}
                idPrefix="repay-page-confirm"
              />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                aria-disabled={isConfirmDisabled || undefined}
                className="flex-[2] rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Repayment
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                You repaid {formatMoney(amount)}!
              </h2>
              <p className="mt-1 text-muted">
                Your transaction was successful.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Remaining debt</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(remainingDebt)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">Credit line utilization</span>
                <span className="font-semibold text-foreground">
                  Reduced to {newPct}%
                </span>
              </div>
            </div>

            <PayoffProjection
              currentDebt={selectedLine.utilized}
              apr={selectedLine.apr}
              repayAmount={amount}
              limit={selectedLine.limit}
              nextPaymentAmount={selectedLine.nextPaymentAmount}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                onClick={handleNewRepay}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Make another repayment
              </button>
            </div>
          </div>
        )}
      </div>

      <InlineHelpOverlay
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        triggerRef={helpTriggerRef}
      />
    </div>
  );
}
