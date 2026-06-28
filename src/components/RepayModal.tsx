import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { formatMoney, getRepayAmountValidation, requiresRepayConfirmation } from '../utils/amountValidation';
import { InlineHelpOverlay } from './InlineHelpOverlay';
import { PendingButton } from './PendingButton';

interface RepaymentCreditLine {
  id: string;
  name: string;
  limit: number;
  utilized: number;
  apr: number;
}

type ModalStep = 'input' | 'review' | 'pending' | 'success';

interface RepayModalProps {
  creditLine: RepaymentCreditLine;
  walletBalance: number;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const COLOR = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  accent: '#58a6ff',
  success: '#3fb950',
  warning: '#d29922',
  danger: '#f85149',
};

const btnBase: React.CSSProperties = {
  border: `1px solid ${COLOR.border}`,
  borderRadius: 6,
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 500,
  cursor: 'pointer',
  background: COLOR.surface,
  color: COLOR.text,
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
};

const btn = {
  ghost: {
    ...btnBase,
    background: 'transparent',
    color: COLOR.muted,
    borderColor: 'transparent',
  } as React.CSSProperties,
  outline: { ...btnBase } as React.CSSProperties,
  primary: {
    ...btnBase,
    background: COLOR.accent,
    color: COLOR.bg,
    border: 'none',
    fontWeight: 600,
  } as React.CSSProperties,
  danger: {
    ...btnBase,
    background: 'rgba(248,81,73,0.12)',
    color: COLOR.danger,
    borderColor: 'rgba(248,81,73,0.3)',
  } as React.CSSProperties,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);

export function RepayModal({
  creditLine,
  walletBalance,
  onClose,
  onSuccess,
}: RepayModalProps) {
  const [step, setStep] = useState<ModalStep>('input');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useFocusTrap({
    isActive: !isHelpOpen,
    onEscape: step !== 'pending' ? onClose : undefined,
  });
  const [amountStr, setAmountStr] = useState('');
  const [confirmAmountStr, setConfirmAmountStr] = useState('');

  useEffect(() => {
    if (step === 'review') {
      setConfirmAmountStr('');
    }
  }, [step]);

  const totalDue = creditLine.utilized;
  const accruedInterestEstimate = (creditLine.utilized * (creditLine.apr / 100)) / 12;
  const validation = getRepayAmountValidation(amountStr, totalDue, walletBalance);
  const amount = validation.amount;
  const isInvalid = !validation.isValid;
  const repayAmountHintId = 'repay-amount-hint';
  const repayAmountConstraintsId = 'repay-amount-constraints';
  const repayAmountStatusId = 'repay-amount-status';

  const remainingDebt = validation.remainingDebt;
  const oldPct = creditLine.limit === 0 ? 0 : Math.round((creditLine.utilized / creditLine.limit) * 100);
  const newPct = creditLine.limit === 0 ? 0 : Math.round((remainingDebt / creditLine.limit) * 100);
  const describedBy = `${repayAmountHintId} ${repayAmountConstraintsId} ${repayAmountStatusId}`;

  const toneMeta = {
    info: { color: '#58a6ff', bg: 'rgba(88,166,255,0.08)', border: 'rgba(88,166,255,0.25)', icon: <Info size={16} aria-hidden="true" /> },
    success: { color: COLOR.success, bg: 'rgba(63,185,80,0.08)', border: 'rgba(63,185,80,0.25)', icon: <CheckCircle size={16} aria-hidden="true" /> },
    warning: { color: COLOR.warning, bg: 'rgba(210,153,34,0.08)', border: 'rgba(210,153,34,0.25)', icon: <AlertTriangle size={16} aria-hidden="true" /> },
    danger: { color: COLOR.danger, bg: 'rgba(248,81,73,0.08)', border: 'rgba(248,81,73,0.25)', icon: <AlertCircle size={16} aria-hidden="true" /> },
  } as const;
  const activeTone = toneMeta[validation.feedback.severity];

  const needsConfirm = requiresRepayConfirmation(amount);
  const confirmParse = (s: string) => Number.parseFloat(s) || 0;
  const isConfirmMatch = needsConfirm ? confirmParse(confirmAmountStr) === amount : true;
  const isConfirmDisabled = needsConfirm && !isConfirmMatch;

  const handlePercent = (pct: number) => {
    let target = (validation.maxRepayAmount * pct) / 100;
    if (target > walletBalance) target = walletBalance;
    setAmountStr(target.toFixed(2));
  };

  const handleReview = () => {
    if (!isInvalid) {
      setStep('review');
    }
  };

  const handleConfirm = () => {
    setStep('pending');
    setTimeout(() => {
      setStep('success');
    }, 2500);
  };

  const handleCloseComplete = () => {
    onSuccess(amount);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}
      onClick={step !== 'pending' ? onClose : undefined} role="presentation">

      <div 
        ref={modalRef}
        style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'slideUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="repay-modal-title"
      >

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${COLOR.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 id="repay-modal-title" style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 600, color: COLOR.text }}>
              {step === 'success' ? 'Repayment Successful' : step === 'review' ? 'Review Repayment' : 'Make a Repayment'}
            </h2>
            {step !== 'success' && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: COLOR.muted }}>
                {creditLine.name} · {creditLine.id}
              </p>
            )}
          </div>
          {step !== 'pending' && <button onClick={onClose} style={{ ...btn.ghost, padding: '0.4rem', borderRadius: 4 }} aria-label="Close modal">✕</button>}
        </div>

        {step === 'input' && (
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                marginBottom: '1.5rem',
                background: COLOR.bg,
                padding: '1rem',
                borderRadius: 8,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <p
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '0.75rem',
                  color: COLOR.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Outstanding debt
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: COLOR.danger, lineHeight: 1 }}>
                  {fmt(totalDue)}
                </p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: COLOR.muted }}>
                    Includes {fmt(accruedInterestEstimate)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: COLOR.muted }}>
                    accrued interest est.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label htmlFor="repay-amount-input" style={{ fontSize: '0.9rem', color: COLOR.text, fontWeight: 500 }}>Repayment amount</label>
                <span style={{ fontSize: '0.8rem', color: validation.feedback.severity === 'danger' ? COLOR.danger : COLOR.muted }}>Wallet: {fmt(walletBalance)}</span>
              </div>
              <p id={repayAmountHintId} style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: COLOR.muted }}>
                Enter the dollar amount you wish to repay. We'll show minimum and maximum guidance.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={() => handlePercent(pct)}
                    style={{ ...btn.outline, flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', color: COLOR.accent, borderColor: 'rgba(88,166,255,0.3)', background: pct === 100 ? 'rgba(88,166,255,0.1)' : 'transparent' }}
                    aria-label={`Set amount to ${pct === 100 ? 'maximum' : pct + ' percent'}`}
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', color: COLOR.muted }} aria-hidden="true">$</span>
                <input
                  id="repay-amount-input"
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  aria-invalid={validation.feedback.severity === 'danger'}
                  aria-describedby={describedBy}
                  className="repay-modal-input"
                  style={{
                    width: '100%',
                    background: COLOR.bg,
                    border: `1px solid ${validation.feedback.severity === 'danger' ? COLOR.danger : validation.feedback.severity === 'warning' ? COLOR.warning : amount > 0 ? COLOR.accent : COLOR.border}`,
                    borderRadius: 8,
                    padding: '0.75rem 1rem 0.75rem 2rem',
                    color: COLOR.text,
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    boxShadow: amount > 0 && validation.feedback.severity !== 'danger' ? '0 0 0 2px rgba(88,166,255,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <div id={repayAmountConstraintsId} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: '0.65rem 0.75rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minimum repayment</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: COLOR.text, fontWeight: 600 }}>{formatMoney(validation.minAmount)}</p>
                </div>
                <div style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: '0.65rem 0.75rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maximum repayment</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: COLOR.text, fontWeight: 600 }}>{formatMoney(validation.maxRepayAmount)}</p>
                </div>
                <div style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: '0.65rem 0.75rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wallet reserve</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: COLOR.text, fontWeight: 600 }}>{formatMoney(validation.recommendedWalletReserve)}</p>
                </div>
              </div>
              <div
                id={repayAmountStatusId}
                role={validation.feedback.severity === 'danger' ? 'alert' : 'status'}
                aria-live="polite"
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  border: `1px solid ${activeTone.border}`,
                  background: activeTone.bg,
                  color: activeTone.color,
                  borderRadius: 8,
                  padding: '0.75rem',
                }}
              >
                <span style={{ display: 'inline-flex', marginTop: 1 }}>{activeTone.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>{validation.feedback.title}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', lineHeight: 1.5 }}>{validation.feedback.message}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '0.75rem',
                  color: COLOR.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Repayment preview
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: COLOR.muted }}>Remaining debt</span>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: amount > 0 && remainingDebt === 0 ? COLOR.success : COLOR.text,
                  }}
                >
                  {fmt(remainingDebt)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: COLOR.muted }}>Utilization after repayment</span>
                <span style={{ fontSize: '0.8rem', color: amount > 0 ? COLOR.success : COLOR.text }}>
                  {newPct}%{' '}
                  <span style={{ textDecoration: 'line-through', color: COLOR.muted, marginLeft: 4 }}>
                    {oldPct}%
                  </span>
                </span>
              </div>

              <div 
                style={{ height: 8, background: COLOR.border, borderRadius: 4, overflow: 'hidden', position: 'relative' }}
                role="progressbar"
                aria-valuenow={newPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="New utilization preview"
              >
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${oldPct}%`, background: COLOR.danger, opacity: amount > 0 ? 0.3 : 1, transition: 'all 0.4s ease' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${newPct}%`, background: remainingDebt === 0 ? COLOR.success : COLOR.warning, transition: 'all 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={handleReview}
                disabled={isInvalid}
                style={{
                  ...btn.primary,
                  width: '100%',
                  opacity: isInvalid ? 0.5 : 1,
                  cursor: isInvalid ? 'not-allowed' : 'pointer',
                }}
              >
                Review Repayment
              </button>
              <button
                ref={helpTriggerRef}
                type="button"
                onClick={() => setIsHelpOpen(true)}
                style={{
                  ...btn.ghost,
                  minHeight: 44,
                  width: '100%',
                  color: COLOR.accent,
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                }}
              >
                I need help
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div style={{ padding: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: COLOR.muted }}>
              You are about to repay:
            </p>
            <p
              style={{
                margin: '0 0 1.5rem',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: COLOR.text,
                textAlign: 'center',
              }}
            >
              {fmt(amount)}
            </p>

            <div
              style={{
                background: COLOR.bg,
                border: `1px solid ${COLOR.border}`,
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                <span style={{ color: COLOR.muted, fontSize: '0.9rem' }}>Remaining debt after repayment</span>
                <span style={{ fontWeight: 600, color: remainingDebt === 0 ? COLOR.success : COLOR.text }}>
                  {fmt(remainingDebt)}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: COLOR.muted, fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Wallet Balance Check
                </span>
                <span
                  style={{
                    color: COLOR.success,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 14,
                      height: 14,
                      background: COLOR.success,
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  Sufficient Balance ({fmt(walletBalance)} available)
                </span>
              </div>
            </div>

            {needsConfirm && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="confirm-repay-amount" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLOR.text, fontWeight: 500 }}>
                  Type the amount to confirm
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', color: COLOR.muted }} aria-hidden="true">$</span>
                  <input
                    id="confirm-repay-amount"
                    type="number"
                    value={confirmAmountStr}
                    onChange={(e) => setConfirmAmountStr(e.target.value)}
                    placeholder={fmt(amount)}
                    aria-describedby="confirm-repay-description"
                    aria-label="Type the repayment amount to confirm"
                    autoComplete="off"
                    className="repay-modal-input"
                    style={{
                      width: '100%',
                      background: COLOR.bg,
                      border: `1px solid ${!isConfirmMatch && confirmAmountStr !== '' ? COLOR.danger : isConfirmMatch && confirmAmountStr !== '' ? COLOR.success : COLOR.border}`,
                      borderRadius: 8,
                      padding: '0.75rem 1rem 0.75rem 2rem',
                      color: COLOR.text,
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  />
                </div>
                <p id="confirm-repay-description" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: COLOR.muted }}>
                  Type the repayment amount ({fmt(amount)}) to enable the Confirm Repayment button.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep('input')} style={{ ...btn.outline, flex: 1 }}>
                Back
              </button>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <PendingButton
                  onClick={handleConfirm}
                  pending={false}
                  pendingLabel="Processing..."
                  disabled={isConfirmDisabled}
                  aria-disabled={isConfirmDisabled || undefined}
                  aria-describedby={isConfirmDisabled ? 'confirm-repay-disabled-helper' : undefined}
                  style={{
                    ...btn.primary,
                    width: '100%',
                    opacity: isConfirmDisabled ? 0.5 : 1,
                    cursor: isConfirmDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  Confirm Repayment
                </PendingButton>
                {isConfirmDisabled && (
                  <p
                    id="confirm-repay-disabled-helper"
                    style={{ margin: 0, fontSize: '0.8rem', color: COLOR.muted, textAlign: 'center' }}
                    role="status"
                  >
                    Type the amount above to enable confirmation.
                  </p>
                )}
              </div>
            </div>
            <button
              ref={helpTriggerRef}
              type="button"
              onClick={() => setIsHelpOpen(true)}
              style={{
                ...btn.ghost,
                minHeight: 44,
                width: '100%',
                marginTop: '0.75rem',
                color: COLOR.accent,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}
            >
              I need help
            </button>
          </div>
        )}

        {step === 'pending' && (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: `3px solid ${COLOR.border}`,
                borderTopColor: COLOR.accent,
                borderRadius: '50%',
                margin: '0 auto 1.5rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: COLOR.text }}>
              Processing repayment
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: COLOR.muted }}>
              Confirming transaction on network...
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: COLOR.muted }}>
              Please check your wallet if confirmation is required.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: 64, height: 64, background: COLOR.success, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', animation: 'scaleIn 0.4s ease' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', color: COLOR.text }}>
              You repaid {fmt(amount)}!
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: COLOR.muted }}>
              Your transaction was successful.
            </p>

            <div
              style={{
                background: COLOR.bg,
                border: `1px solid ${COLOR.border}`,
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.4rem',
                  fontSize: '0.9rem',
                  color: COLOR.text,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: COLOR.muted }}>Remaining debt:</span>
                <span style={{ fontWeight: 600 }}>{fmt(remainingDebt)}</span>
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: COLOR.muted,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Credit utilization:</span>
                <span style={{ color: remainingDebt === 0 ? COLOR.success : COLOR.text }}>
                  Reduced to {newPct}%
                </span>
              </p>
            </div>

            <button onClick={handleCloseComplete} style={{ ...btn.primary, width: '100%' }}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 100% { transform: scale(1); } }
        /* Suppress default outline for pointer users; show a visible ring for keyboard users (WCAG 2.4.7). */
        .repay-modal-input { outline: none; }
        .repay-modal-input:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
      `}</style>
      <InlineHelpOverlay
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        triggerRef={helpTriggerRef}
      />
    </div>
  );
}
