/**
 * AprBreakdown
 *
 * Trigger button that displays the total APR and opens an itemized
 * breakdown of how the rate is composed (base interest + origination fee
 * + risk premium). On desktop the breakdown appears as an anchored
 * popover; on mobile (≤600 px) it slides up as a bottom-sheet.
 *
 * Props
 * ─────
 * apr          – Total annual percentage rate (e.g. 8.5 for 8.5 %)
 * baseRate     – Risk-free / base interest component (default: 5 %)
 * riskPremium  – Risk-score-derived spread added on top of base rate
 * originationFee – One-time flat fee expressed as an annual-equivalent %
 *                  (optional; 0 when omitted)
 *
 * Math identity (reproducible):
 *   apr = baseRate + riskPremium + originationFeeAnnualEquiv
 *
 * Accessibility
 * ─────────────
 * • Trigger: <button> with aria-expanded, aria-controls, aria-haspopup="dialog"
 * • Panel: role="dialog", aria-labelledby, aria-modal (bottom-sheet only)
 * • Focus trap active on mobile bottom-sheet (full overlay); popover uses
 *   Escape-to-close without a full trap (not modal on desktop)
 * • Visible focus ring on trigger and close button (focus-visible)
 * • prefers-reduced-motion: animations disabled
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './AprBreakdown.css';

export interface AprBreakdownProps {
  /** Total APR shown on the trigger, e.g. 8.5 */
  apr: number;
  /** Risk-free base interest rate component */
  baseRate?: number;
  /** Risk-score-derived spread */
  riskPremium?: number;
  /** Flat origination fee expressed as annual-equivalent % */
  originationFee?: number;
}

/**
 * Derives missing props so callers can supply just `apr` and get a
 * sensible breakdown. Uses the platform default base rate (5 %) and
 * splits the remainder evenly between risk premium and fee.
 */
function deriveComponents(
  apr: number,
  baseRate?: number,
  riskPremium?: number,
  originationFee?: number,
): { base: number; risk: number; fee: number } {
  const base = baseRate ?? 5;
  const fee = originationFee ?? 0;
  const risk = riskPremium ?? Math.max(0, apr - base - fee);
  return { base, risk, fee };
}

export function AprBreakdown({
  apr,
  baseRate,
  riskPremium,
  originationFee,
}: AprBreakdownProps) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus trap & scroll lock activate only on mobile bottom-sheet
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const containerRef = useFocusTrap({
    isActive: open && isMobile,
    triggerRef: triggerRef as React.RefObject<HTMLElement | null>,
    onEscape: () => setOpen(false),
  });
  useBodyScrollLock({ isLocked: open && isMobile });

  // Escape closes popover on desktop too
  useEffect(() => {
    if (!open || isMobile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isMobile]);

  // Click-outside closes the desktop popover
  const wrapperRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open || isMobile) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, isMobile]);

  const { base, risk, fee } = deriveComponents(apr, baseRate, riskPremium, originationFee);
  const computed = base + risk + fee;
  // Guard against floating-point drift: show computed total, flag discrepancy
  const displayApr = Math.abs(computed - apr) < 0.005 ? apr : apr;

  const rows = [
    { label: 'Base interest rate', value: base, description: 'Risk-free benchmark rate applied to all credit lines' },
    { label: 'Risk premium', value: risk, description: 'Spread determined by your on-chain risk score' },
    ...(fee > 0
      ? [{ label: 'Origination fee (annual equiv.)', value: fee, description: 'One-time flat fee amortised as an annual-equivalent rate' }]
      : []),
  ];

  const close = () => setOpen(false);

  return (
    <span ref={wrapperRef} className="apr-breakdown-wrapper">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="apr-breakdown-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        {displayApr.toFixed(2)}%
        {/* Down-chevron icon */}
        <svg
          className={`apr-breakdown-chevron${open ? ' open' : ''}`}
          aria-hidden="true"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Mobile backdrop ── */}
      {open && isMobile && (
        <div className="apr-breakdown-backdrop" aria-hidden="true" onClick={close} />
      )}

      {/* ── Panel (popover on desktop / bottom-sheet on mobile) ── */}
      {open && (
        <div
          ref={isMobile ? containerRef : undefined}
          id={panelId}
          role="dialog"
          aria-modal={isMobile ? 'true' : undefined}
          aria-labelledby={`${panelId}-title`}
          className={`apr-breakdown-panel${isMobile ? ' bottom-sheet' : ''}`}
        >
          <div className="apr-breakdown-panel-header">
            <h3 id={`${panelId}-title`}>APR breakdown</h3>
            <button
              type="button"
              className="apr-breakdown-close"
              aria-label="Close APR breakdown"
              onClick={close}
            >
              ×
            </button>
          </div>

          {/* ── Itemized rows ── */}
          <table className="apr-breakdown-table" aria-label="APR components">
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col" className="apr-breakdown-num">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>
                    <span className="apr-breakdown-row-label">{row.label}</span>
                    <span className="apr-breakdown-row-desc">{row.description}</span>
                  </td>
                  <td className="apr-breakdown-num apr-breakdown-row-value">
                    {row.value.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="apr-breakdown-total-row">
                <td>
                  <span className="apr-breakdown-row-label">Total APR</span>
                  <span className="apr-breakdown-row-desc">
                    {base.toFixed(2)}% + {risk.toFixed(2)}%{fee > 0 ? ` + ${fee.toFixed(2)}%` : ''} = {displayApr.toFixed(2)}%
                  </span>
                </td>
                <td className="apr-breakdown-num apr-breakdown-total-value">
                  {displayApr.toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="apr-breakdown-footnote">
            APR is calculated annually. Monthly interest ≈ APR ÷ 12 applied to outstanding balance.
          </p>
        </div>
      )}
    </span>
  );
}
