/**
 * RiskGauge
 *
 * Renders a semicircular SVG arc gauge for a 0–100 risk score.
 *
 * Animation behaviour
 * ─────────────────────────────────────────────────────────────────────────────
 * When `score` changes the arc sweeps from empty (full dashoffset = circumference)
 * to the target value via a CSS keyframe animation.  The animation is re-triggered
 * by changing the `key` prop on the <path> element whenever the score changes —
 * this is the lightest-weight way to restart a CSS animation without JavaScript
 * timers.
 *
 * Reduced-motion
 * ─────────────────────────────────────────────────────────────────────────────
 * Two layers of protection:
 *   1. CSS:  `@media (prefers-reduced-motion: reduce)` disables the keyframe and
 *      sets `transition: none` so the fill jumps straight to its final value.
 *   2. JS:   `useReducedMotion()` hook reads `matchMedia` synchronously so the
 *      initial render never starts at offset = circumference before snapping —
 *      there is no flash-of-empty-gauge for reduced-motion users.
 *
 * Theme-aware stroke
 * ─────────────────────────────────────────────────────────────────────────────
 * The fill stroke is set via `color` (currentColor) so it inherits the semantic
 * `--success / --warning / --error` tokens set inline on the wrapper element.
 * No hardcoded hex values appear in this file.
 *
 * SR text
 * ─────────────────────────────────────────────────────────────────────────────
 * The SVG carries `role="img"` and `aria-labelledby` pointing at a hidden
 * `<title>` element.  A sibling `<p className="sr-only">` duplicates the
 * description outside the SVG for AT implementations that skip inline SVG titles.
 */

import { useMemo, useRef } from 'react';
import './RiskGauge.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskGaugeProps {
  /** Risk score 0–100. Values outside this range are clamped. */
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RADIUS = 55;
const CX = 80;
const CY = 75;
/** Length of a 180° arc at RADIUS. */
const CIRCUMFERENCE = Math.PI * RADIUS; // ≈ 172.79

const TREND_ARROW: Record<RiskGaugeProps['trend'], string> = {
  improving: '▲',
  declining: '▼',
  stable: '─',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the CSS custom property name for the arc stroke colour.
 * Using `var(--…)` here means the colour follows `[data-contrast="high"]`
 * overrides automatically.
 */
function gaugeColorVar(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--error)';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Hook: reduced-motion ─────────────────────────────────────────────────────

/**
 * Reads `prefers-reduced-motion` synchronously via `matchMedia`.
 * Returns `true` when the user has requested reduced motion.
 * Falls back to `false` in environments where `matchMedia` is unavailable
 * (SSR, jsdom without the media query polyfill).
 */
function useReducedMotion(): boolean {
  // matchMedia is not available in jsdom by default; guard defensively.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiskGauge({ score, trend, lastUpdated }: RiskGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const offset = CIRCUMFERENCE - (normalizedScore / 100) * CIRCUMFERENCE;
  const colorVar = gaugeColorVar(normalizedScore);
  const reducedMotion = useReducedMotion();

  /**
   * Arc path descriptor (shared between bg and fill).
   * Starts at the left end of the semicircle, sweeps clockwise to the right.
   */
  const arcPath = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

  /**
   * `animKey` changes every time `normalizedScore` changes.
   * Assigning it as the React `key` on the fill <path> forces React to
   * unmount/remount the element, which re-triggers the CSS @keyframes
   * animation from scratch without any JS timer logic.
   */
  const animKey = `gauge-fill-${normalizedScore}`;

  /**
   * When reduced motion is active we skip the animation entirely by starting
   * the dashoffset at its final value rather than at `CIRCUMFERENCE`.
   * This prevents the brief flash-of-empty-arc that would otherwise appear
   * while the CSS media query suppresses the keyframe.
   */
  const initialOffset = reducedMotion ? offset : CIRCUMFERENCE;

  // Unique ID for aria-labelledby — stable across renders.
  const titleId = useRef(`risk-gauge-title-${Math.random().toString(36).slice(2)}`).current;

  const trendLabel = trend.charAt(0).toUpperCase() + trend.slice(1);
  const trendArrow = TREND_ARROW[trend];

  const srDescription = useMemo(
    () =>
      `Risk score ${normalizedScore} out of 100. Trend: ${trendLabel}. Last updated ${formatDate(lastUpdated)}.`,
    [normalizedScore, trendLabel, lastUpdated],
  );

  return (
    <div className="risk-gauge-container">
      {/* Screen-reader description outside SVG for AT implementations that
          skip <title> inside inline SVG. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {srDescription}
      </p>

      <svg
        className="risk-gauge-svg"
        viewBox="0 0 160 100"
        role="img"
        aria-labelledby={titleId}
        aria-hidden="false"
      >
        {/* SVG title — announced by AT when the SVG itself is focused */}
        <title id={titleId}>{srDescription}</title>

        {/* Background track */}
        <path
          className="risk-gauge-bg"
          d={arcPath}
          aria-hidden="true"
        />

        {/*
          Fill arc.
          key=animKey forces remount → restarts @keyframes on score change.
          style sets the CSS custom property --gauge-offset which the
          keyframe animates toward; reduced-motion users get the final value
          directly via initialOffset = offset.
        */}
        <path
          key={animKey}
          className="risk-gauge-fill"
          d={arcPath}
          stroke={colorVar}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={initialOffset}
          style={
            {
              '--gauge-target-offset': offset,
              '--gauge-circumference': CIRCUMFERENCE,
            } as React.CSSProperties
          }
          aria-hidden="true"
          data-score={normalizedScore}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
        />

        {/* Score numeral */}
        <text
          x={CX}
          y={CY - 12}
          className="risk-gauge-score"
          aria-hidden="true"
        >
          {normalizedScore}
        </text>

        {/* "Risk Score" label */}
        <text
          x={CX}
          y={CY - 38}
          className="risk-gauge-label"
          aria-hidden="true"
        >
          Risk Score
        </text>
      </svg>

      <div className="risk-meta" aria-hidden="true">
        <div className="risk-meta-item">
          <span className="rm-label">Trend</span>
          <span
            className="rm-value"
            style={{ color: `var(--${trend === 'improving' ? 'success' : trend === 'declining' ? 'error' : 'muted'})` }}
          >
            {trendArrow} {trendLabel}
          </span>
        </div>
        <div className="risk-meta-item">
          <span className="rm-label">Last Updated</span>
          <span className="rm-value" style={{ color: 'var(--muted)' }}>
            {formatDate(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}
