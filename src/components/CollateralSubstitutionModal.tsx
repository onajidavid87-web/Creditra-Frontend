/**
 * CollateralSubstitutionModal
 *
 * Three-step flow that lets a borrower swap one pledged collateral asset
 * for another. Steps:
 *
 *   1. Select   — pick the incoming asset from the catalogue
 *   2. Review   — side-by-side LTV comparison + fee breakdown
 *   3. Confirm  — type the incoming asset name to unlock submission
 *
 * Accessibility: focus trap, body-scroll lock, inert backdrop, ARIA dialog.
 * WCAG 2.1 AA — LTV changes communicated by color + numeric value + text.
 *
 * @see src/types/collateral.ts   — domain types
 * @see src/utils/collateral.ts   — pure helpers (LTV math, fee calc)
 */
import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useInertBackdrop } from '../hooks/useInertBackdrop';
import { PendingButton } from './PendingButton';
import type { CollateralAsset, SubstitutionStep, SubstitutionStatus } from '../types/collateral';
import {
  AVAILABLE_COLLATERAL_ASSETS,
  categoryIcon,
  computeLtvSnapshot,
  computeSubstitutionFee,
  fmtLtv,
  fmtLtvDelta,
} from '../utils/collateral';
import { fmt } from '../utils/tokens';
import './CollateralSubstitutionModal.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollateralSubstitutionModalProps {
  /** Whether the modal is rendered and visible. */
  isOpen: boolean;
  /** Invoked when the user dismisses the modal without completing the flow. */
  onClose: () => void;
  /**
   * Invoked after a successful substitution submission.
   * The parent is responsible for refetching or updating its local state.
   *
   * @param incomingAsset  The asset that was pledged.
   */
  onSuccess: (incomingAsset: CollateralAsset) => void;
  /** Human-readable credit-line name, shown in the header subtitle. */
  creditLineName: string;
  /** The credit line's outstanding loan balance in USD. */
  loanBalance: number;
  /**
   * The asset currently pledged against this credit line.
   * When `undefined` the modal still works; the left card shows "None".
   */
  currentAsset?: CollateralAsset;
  /** Ref to the trigger button so focus returns correctly on close. */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /**
   * Simulated network delay in ms for the submission Promise.
   * Defaults to 1800. Override in tests to keep them fast.
   * @internal
   */
  _delayMs?: number;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { id: SubstitutionStep; label: string; n: number }[] = [
  { id: 'select',  label: 'Select',  n: 1 },
  { id: 'review',  label: 'Review',  n: 2 },
  { id: 'confirm', label: 'Confirm', n: 3 },
];

function Stepper({ current }: { current: SubstitutionStep }) {
  return (
    <div className="csm-stepper" aria-label="Progress">
      {STEPS.map((step, i) => {
        const stepIndex = STEPS.findIndex(s => s.id === current);
        const isDone   = i < stepIndex;
        const isActive = step.id === current;
        return (
          <React.Fragment key={step.id}>
            {i > 0 && <div className="csm-step-divider" aria-hidden="true" />}
            <div
              className={`csm-step ${isActive ? 'csm-step--active' : ''} ${isDone ? 'csm-step--done' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="csm-step-dot" aria-hidden="true">
                {isDone ? '✓' : step.n}
              </span>
              <span>{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── LTV progress bar helper ──────────────────────────────────────────────────

function LtvBar({
  ltvRatio,
  maxLtvRatio,
}: {
  ltvRatio: number;
  maxLtvRatio: number;
}) {
  const fillPct  = Math.min(ltvRatio * 100, 100);
  const isOver   = ltvRatio > maxLtvRatio;
  const fillColor = isOver ? 'var(--error)' : ltvRatio > maxLtvRatio * 0.85
    ? 'var(--warning)' : 'var(--success)';

  return (
    <div
      className="csm-ltv-bar"
      role="progressbar"
      aria-valuenow={Math.round(ltvRatio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`LTV: ${fmtLtv(ltvRatio)} of ${fmtLtv(maxLtvRatio)} max`}
    >
      <div
        className="csm-ltv-fill"
        style={{ width: `${fillPct}%`, background: fillColor }}
      />
    </div>
  );
}

// ─── Asset card (comparison side) ────────────────────────────────────────────

function AssetCard({
  asset,
  loanBalance,
  variant,
}: {
  asset: CollateralAsset | undefined;
  loanBalance: number;
  variant: 'current' | 'incoming';
}) {
  const snap = asset ? computeLtvSnapshot(asset, loanBalance) : null;

  return (
    <div className={`csm-asset-card csm-asset-card--${variant}`}>
      <span className={`csm-asset-card-badge csm-asset-card-badge--${variant}`}>
        {variant === 'current' ? 'Current' : 'Incoming'}
      </span>

      <div>
        <p className="csm-asset-card-name">
          {asset ? asset.name : 'None'}
        </p>
        {asset?.ticker && (
          <span className="csm-asset-card-ticker">{asset.ticker}</span>
        )}
      </div>

      <hr className="csm-asset-card-divider" />

      <div className="csm-asset-card-rows">
        <div className="csm-asset-card-row">
          <span className="csm-asset-card-row-label">Value</span>
          <span className="csm-asset-card-row-value">
            {asset ? fmt(asset.value) : '—'}
          </span>
        </div>
        <div className="csm-asset-card-row">
          <span className="csm-asset-card-row-label">LTV</span>
          <span
            className={`csm-asset-card-row-value ${snap?.isOverLtv ? 'csm-asset-card-row-value--over-ltv' : ''}`}
          >
            {snap ? fmtLtv(snap.ltvRatio) : '—'}
          </span>
        </div>
        <div className="csm-asset-card-row">
          <span className="csm-asset-card-row-label">Max LTV</span>
          <span className="csm-asset-card-row-value">
            {asset ? fmtLtv(asset.maxLtvRatio) : '—'}
          </span>
        </div>
        <div className="csm-asset-card-row">
          <span className="csm-asset-card-row-label">Headroom</span>
          <span className="csm-asset-card-row-value">
            {snap ? fmt(Math.max(snap.availableHeadroom, 0)) : '—'}
          </span>
        </div>
      </div>

      {snap && (
        <LtvBar ltvRatio={snap.ltvRatio} maxLtvRatio={asset!.maxLtvRatio} />
      )}
    </div>
  );
}

// ─── Step 1: Select ───────────────────────────────────────────────────────────

function SelectStep({
  current,
  selected,
  onSelect,
  loanBalance,
}: {
  current: CollateralAsset | undefined;
  selected: CollateralAsset | null;
  onSelect: (asset: CollateralAsset) => void;
  loanBalance: number;
}) {
  const candidates = AVAILABLE_COLLATERAL_ASSETS.filter(
    a => a.id !== current?.id,
  );

  return (
    <div className="csm-body">
      <p className="csm-select-heading">
        Choose the asset you want to pledge as collateral
      </p>
      <ul className="csm-asset-list" role="listbox" aria-label="Available collateral assets">
        {candidates.map(asset => {
          const snap     = computeLtvSnapshot(asset, loanBalance);
          const isChosen = selected?.id === asset.id;
          return (
            <li key={asset.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={isChosen}
                className={`csm-asset-option ${isChosen ? 'csm-asset-option--selected' : ''}`}
                onClick={() => onSelect(asset)}
              >
                <span className="csm-asset-option-icon" aria-hidden="true">
                  {categoryIcon(asset.category)}
                </span>
                <span className="csm-asset-option-info">
                  <span className="csm-asset-option-name">{asset.name}</span>
                  <span className="csm-asset-option-meta">
                    {asset.ticker && <span>{asset.ticker}</span>}
                    <span>Value: {fmt(asset.value)}</span>
                  </span>
                </span>
                <span className="csm-asset-option-value">
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                    {fmtLtv(snap.ltvRatio)}
                  </span>
                  <span className="csm-asset-option-ltv">
                    Max {fmtLtv(asset.maxLtvRatio)}
                  </span>
                </span>
                {isChosen && (
                  <span className="csm-asset-check" aria-hidden="true">✓</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Step 2: Review ───────────────────────────────────────────────────────────

function ReviewStep({
  current,
  incoming,
  loanBalance,
}: {
  current: CollateralAsset | undefined;
  incoming: CollateralAsset;
  loanBalance: number;
}) {
  const outSnap = current ? computeLtvSnapshot(current, loanBalance) : null;
  const inSnap  = computeLtvSnapshot(incoming, loanBalance);
  const fee     = computeSubstitutionFee(loanBalance, incoming);
  const delta   = outSnap ? fmtLtvDelta(outSnap, inSnap) : null;

  return (
    <div className="csm-body">
      {/* Side-by-side comparison */}
      <section aria-labelledby="csm-compare-heading">
        <h3 id="csm-compare-heading" className="csm-select-heading">
          Collateral comparison
        </h3>
        <div className="csm-compare">
          <AssetCard asset={current} loanBalance={loanBalance} variant="current" />

          {/* Arrow + delta */}
          <div className="csm-arrow-col" aria-hidden="true">
            <ArrowRight className="csm-arrow-icon" size={22} />
            {delta && (
              <span
                className={`csm-delta-pill csm-delta-pill--${
                  delta.isImprovement ? 'improvement' : 'degradation'
                }`}
              >
                {delta.text}
              </span>
            )}
          </div>

          <AssetCard asset={incoming} loanBalance={loanBalance} variant="incoming" />
        </div>

        {/* Screen-reader summary of the delta */}
        {delta && (
          <p className="sr-only" aria-live="polite">
            LTV change: {delta.text}.{' '}
            {delta.isImprovement ? 'This is an improvement.' : 'This increases your LTV.'}
          </p>
        )}
      </section>

      {/* Over-LTV warning */}
      {inSnap.isOverLtv && (
        <div className="csm-warning" role="alert">
          <AlertTriangle className="csm-warning-icon" size={18} aria-hidden="true" />
          <div>
            <p className="csm-warning-title">LTV exceeds the maximum for this asset</p>
            <p className="csm-warning-body">
              Your outstanding balance of {fmt(loanBalance)} exceeds the maximum
              LTV for {incoming.name} ({fmtLtv(incoming.maxLtvRatio)}).
              You may need to repay a portion of your balance before proceeding.
            </p>
          </div>
        </div>
      )}

      {/* Fee breakdown */}
      <section aria-labelledby="csm-fee-heading">
        <div className="csm-fee-box">
          <p className="csm-fee-heading" id="csm-fee-heading">Substitution fees</p>
          <div className="csm-fee-row">
            <span className="csm-fee-row-label">Processing fee (0.5% of balance)</span>
            <span className="csm-fee-row-value">{fmt(fee.processingFee)}</span>
          </div>
          {fee.appraisalFee !== undefined && (
            <div className="csm-fee-row">
              <span className="csm-fee-row-label">Appraisal fee</span>
              <span className="csm-fee-row-value">{fmt(fee.appraisalFee)}</span>
            </div>
          )}
          <div className="csm-fee-divider" />
          <div className="csm-fee-total-row">
            <span className="csm-fee-total-label">Total due at submission</span>
            <span className="csm-fee-total-value">{fmt(fee.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────

function ConfirmStep({
  current,
  incoming,
  loanBalance,
  confirmText,
  onConfirmTextChange,
  submitError,
}: {
  current: CollateralAsset | undefined;
  incoming: CollateralAsset;
  loanBalance: number;
  confirmText: string;
  onConfirmTextChange: (v: string) => void;
  submitError: string | null;
}) {
  const fee        = computeSubstitutionFee(loanBalance, incoming);
  const targetText = incoming.name;
  const isMatch    = confirmText.trim().toLowerCase() === targetText.toLowerCase();
  const inputId    = 'csm-confirm-name-input';
  const hintId     = 'csm-confirm-hint';

  return (
    <div className="csm-body">
      {/* Summary recap */}
      <section aria-labelledby="csm-confirm-summary-heading">
        <h3 id="csm-confirm-summary-heading" className="csm-select-heading">
          Review before confirming
        </h3>
        <dl className="csm-confirm-summary">
          <div className="csm-confirm-row">
            <dt className="csm-confirm-row-label">Replacing</dt>
            <dd className="csm-confirm-row-value">{current?.name ?? 'None'}</dd>
          </div>
          <div className="csm-confirm-row">
            <dt className="csm-confirm-row-label">New collateral</dt>
            <dd className="csm-confirm-row-value" style={{ color: 'var(--accent)' }}>
              {incoming.name}
            </dd>
          </div>
          <div className="csm-confirm-row">
            <dt className="csm-confirm-row-label">New LTV</dt>
            <dd className="csm-confirm-row-value">
              {fmtLtv(computeLtvSnapshot(incoming, loanBalance).ltvRatio)}
            </dd>
          </div>
          <div className="csm-confirm-row">
            <dt className="csm-confirm-row-label">Total fee</dt>
            <dd className="csm-confirm-row-value" style={{ color: 'var(--accent)' }}>
              {fmt(fee.total)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Confirmation input */}
      <div className="csm-confirm-input-wrap">
        <label htmlFor={inputId} className="csm-confirm-label">
          Type <strong>{targetText}</strong> to confirm
        </label>
        <p id={hintId} className="csm-confirm-hint">
          This action is irreversible. Typing the asset name acknowledges that
          the substitution will be processed and the fee will be charged.
        </p>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          value={confirmText}
          onChange={e => onConfirmTextChange(e.target.value)}
          placeholder={targetText}
          aria-describedby={hintId}
          aria-invalid={confirmText.length > 0 && !isMatch}
          className={`csm-confirm-input ${isMatch && confirmText.length > 0 ? 'csm-confirm-input--valid' : ''}`}
        />
      </div>

      {/* Submission error */}
      {submitError && (
        <div className="csm-error-alert" role="alert">
          <XCircle className="csm-error-icon" size={18} aria-hidden="true" />
          <div>
            <p className="csm-error-title">Submission failed</p>
            <p className="csm-error-body">{submitError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({
  incoming,
  onClose,
}: {
  incoming: CollateralAsset;
  onClose: () => void;
}) {
  return (
    <div className="csm-success">
      <div className="csm-success-icon" aria-hidden="true">
        <CheckCircle color="var(--bg)" size={32} strokeWidth={2.5} />
      </div>
      <p className="csm-success-title">Collateral substituted</p>
      <p className="csm-success-body">
        <strong>{incoming.name}</strong> is now pledged as collateral.
        Your credit line has been updated and the fee has been queued for processing.
      </p>
      <button type="button" className="csm-btn csm-btn--primary" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

/**
 * CollateralSubstitutionModal
 *
 * Orchestrates the three-step substitution flow.
 * All async state is managed here; child steps are stateless.
 */
export function CollateralSubstitutionModal({
  isOpen,
  onClose,
  onSuccess,
  creditLineName,
  loanBalance,
  currentAsset,
  triggerRef,
  _delayMs = 1800,
}: CollateralSubstitutionModalProps) {
  const modalId = 'collateral-substitution-modal';

  const [step, setStep]               = useState<SubstitutionStep>('select');
  const [selected, setSelected]       = useState<CollateralAsset | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus]           = useState<SubstitutionStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset all state when the modal closes / re-opens.
  const handleClose = useCallback(() => {
    setStep('select');
    setSelected(null);
    setConfirmText('');
    setStatus('idle');
    setSubmitError(null);
    onClose();
  }, [onClose]);

  // Accessibility hooks
  const containerRef = useFocusTrap({
    isActive: isOpen,
    triggerRef,
    onEscape: status === 'pending' ? undefined : handleClose,
  });
  useBodyScrollLock({ isLocked: isOpen });
  useInertBackdrop({ isInert: isOpen, modalId });

  // ── Derived ──────────────────────────────────────────────────────────────
  const canProceedFromSelect = selected !== null;
  const isConfirmMatch =
    selected !== null &&
    confirmText.trim().toLowerCase() === selected.name.toLowerCase();
  const incomingSnap = selected
    ? computeLtvSnapshot(selected, loanBalance)
    : null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectAsset = (asset: CollateralAsset) => setSelected(asset);

  const handleNextFromSelect = () => {
    if (canProceedFromSelect) setStep('review');
  };

  const handleNextFromReview = () => setStep('confirm');

  const handleBack = () => {
    if (step === 'review')   setStep('select');
    if (step === 'confirm') { setStep('review'); setConfirmText(''); }
  };

  const handleSubmit = async () => {
    if (!selected || !isConfirmMatch) return;
    setStatus('pending');
    setSubmitError(null);
    try {
      // Simulate network delay. Replace with real API call.
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          // Simulate a 5 % chance of error so the error path is testable.
          if (Math.random() < 0.05) {
            reject(new Error('Network error — please try again.'));
          } else {
            resolve();
          }
        }, _delayMs)
      );
      setStatus('success');
      onSuccess(selected);
    } catch (err) {
      setStatus('error');
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    }
  };

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  const isPending = status === 'pending';

  const stepTitles: Record<SubstitutionStep, string> = {
    select:  'Choose new collateral',
    review:  'Compare collateral',
    confirm: 'Confirm substitution',
  };

  return (
    <div id={modalId} className="csm-portal">
      {/* Backdrop */}
      <div
        className="csm-backdrop"
        aria-hidden="true"
        onClick={isPending ? undefined : handleClose}
      />

      {/* Dialog */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="csm-title"
        aria-describedby="csm-subtitle"
        className="csm-dialog"
        onKeyDown={e => {
          if (e.key === 'Escape' && !isPending) handleClose();
        }}
      >
        {/* Header */}
        <div className="csm-header">
          <div className="csm-header-text">
            <p className="csm-kicker">GrantFox · Collateral</p>
            <h2 id="csm-title" className="csm-title">
              {status === 'success'
                ? 'Substitution complete'
                : stepTitles[step]}
            </h2>
            <p id="csm-subtitle" className="csm-subtitle">
              {creditLineName}
            </p>
          </div>
          {!isPending && (
            <button
              type="button"
              className="csm-close"
              aria-label="Close collateral substitution dialog"
              onClick={handleClose}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Stepper (not shown on success) */}
        {status !== 'success' && <Stepper current={step} />}

        {/* Body */}
        {status === 'success' && selected ? (
          <SuccessState incoming={selected} onClose={handleClose} />
        ) : step === 'select' ? (
          <SelectStep
            current={currentAsset}
            selected={selected}
            onSelect={handleSelectAsset}
            loanBalance={loanBalance}
          />
        ) : step === 'review' && selected ? (
          <ReviewStep
            current={currentAsset}
            incoming={selected}
            loanBalance={loanBalance}
          />
        ) : step === 'confirm' && selected ? (
          <ConfirmStep
            current={currentAsset}
            incoming={selected}
            loanBalance={loanBalance}
            confirmText={confirmText}
            onConfirmTextChange={setConfirmText}
            submitError={status === 'error' ? submitError : null}
          />
        ) : null}

        {/* Footer action bar */}
        {status !== 'success' && (
          <div className="csm-footer">
            {step !== 'select' && (
              <button
                type="button"
                className="csm-btn csm-btn--ghost"
                onClick={handleBack}
                disabled={isPending}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="csm-btn csm-btn--ghost"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </button>

            {step === 'select' && (
              <button
                type="button"
                className="csm-btn csm-btn--primary"
                onClick={handleNextFromSelect}
                disabled={!canProceedFromSelect}
                aria-describedby={!canProceedFromSelect ? 'csm-select-hint' : undefined}
              >
                Review
              </button>
            )}

            {step === 'review' && (
              <button
                type="button"
                className="csm-btn csm-btn--primary"
                onClick={handleNextFromReview}
                disabled={incomingSnap?.isOverLtv}
                title={incomingSnap?.isOverLtv ? 'Resolve LTV before proceeding' : undefined}
              >
                Continue
              </button>
            )}

            {step === 'confirm' && (
              <PendingButton
                pending={isPending}
                pendingLabel="Submitting…"
                onClick={handleSubmit}
                disabled={!isConfirmMatch || isPending}
                className="csm-btn csm-btn--primary"
                aria-describedby={!isConfirmMatch ? 'csm-confirm-name-input' : undefined}
              >
                Confirm substitution
              </PendingButton>
            )}
          </div>
        )}

        {/* Hidden helper for the disabled "Review" button */}
        {step === 'select' && !canProceedFromSelect && (
          <p id="csm-select-hint" className="sr-only">
            Select a collateral asset to proceed.
          </p>
        )}
      </div>
    </div>
  );
}
