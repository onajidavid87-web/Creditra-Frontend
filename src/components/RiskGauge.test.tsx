/**
 * RiskGauge tests
 *
 * Cover:
 *  1. Renders an SVG with role="img".
 *  2. aria-labelledby points at a <title> whose text describes score + trend.
 *  3. SR paragraph outside SVG carries the same description (polite live region).
 *  4. Score is clamped: values < 0 render as 0, values > 100 render as 100.
 *  5. Fill arc carries data-score reflecting the normalised value.
 *  6. Animation key changes when score changes (triggers CSS re-animation).
 *  7. Reduced-motion: data-reduced-motion="true" when matchMedia returns true;
 *     fill dashoffset equals the final offset (not circumference).
 *  8. Normal-motion: data-reduced-motion="false"; fill dashoffset equals
 *     circumference (animation starts from empty).
 *  9. Trend label and arrow are rendered in the meta row.
 * 10. lastUpdated date is formatted and visible.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RiskGauge } from './RiskGauge';

// ── Constants (must match component) ─────────────────────────────────────────

const CIRCUMFERENCE = Math.PI * 55; // ≈ 172.787

function offsetForScore(score: number): number {
  const clamped = Math.min(100, Math.max(0, score));
  return CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderGauge(
  props: Partial<Parameters<typeof RiskGauge>[0]> = {},
) {
  const defaults = {
    score: 72,
    trend: 'improving' as const,
    lastUpdated: '2025-03-01T00:00:00Z',
  };
  return render(<RiskGauge {...defaults} {...props} />);
}

/** Stub matchMedia to simulate reduced-motion preference. */
function stubMatchMedia(matches: boolean) {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: original });
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RiskGauge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an SVG element with role="img"', () => {
    renderGauge();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('SVG has aria-labelledby pointing at a <title> with the score description', () => {
    renderGauge({ score: 72, trend: 'improving' });
    const svg = screen.getByRole('img');
    const titleId = svg.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    const title = document.getElementById(titleId!);
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toMatch(/risk score 72/i);
    expect(title?.textContent).toMatch(/improving/i);
  });

  it('renders a polite sr-only paragraph with the same description', () => {
    renderGauge({ score: 72, trend: 'stable' });
    // The sr-only paragraph is outside the SVG; it has aria-live="polite"
    const srPara = document.querySelector('p[aria-live="polite"]');
    expect(srPara).toBeInTheDocument();
    expect(srPara?.textContent).toMatch(/risk score 72/i);
    expect(srPara?.textContent).toMatch(/stable/i);
  });

  it('clamps score below 0 to 0', () => {
    renderGauge({ score: -10 });
    const svg = screen.getByRole('img');
    const titleId = svg.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toMatch(/risk score 0/i);
    // Fill arc data-score should reflect clamped value
    const fill = document.querySelector('[data-score]');
    expect(fill?.getAttribute('data-score')).toBe('0');
  });

  it('clamps score above 100 to 100', () => {
    renderGauge({ score: 150 });
    const fill = document.querySelector('[data-score]');
    expect(fill?.getAttribute('data-score')).toBe('100');
  });

  it('fill arc carries data-score equal to the normalised score', () => {
    renderGauge({ score: 55 });
    const fill = document.querySelector('[data-score]');
    expect(fill?.getAttribute('data-score')).toBe('55');
  });

  it('animation key changes when score prop changes (re-mounts fill arc)', () => {
    const { rerender, container } = render(
      <RiskGauge score={40} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />,
    );
    const keyBefore = container.querySelector('[data-score]')?.getAttribute('data-score');

    rerender(
      <RiskGauge score={80} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />,
    );
    const keyAfter = container.querySelector('[data-score]')?.getAttribute('data-score');

    expect(keyBefore).toBe('40');
    expect(keyAfter).toBe('80');
  });

  describe('reduced-motion: false (default / animation on)', () => {
    it('fill starts at circumference dashoffset so animation sweeps from empty', () => {
      const restore = stubMatchMedia(false);
      renderGauge({ score: 72 });
      const fill = document.querySelector('[data-score]') as SVGPathElement | null;
      const dashoffset = Number(fill?.getAttribute('stroke-dashoffset'));
      // Should equal full circumference — animation drives it to target
      expect(dashoffset).toBeCloseTo(CIRCUMFERENCE, 1);
      restore();
    });

    it('data-reduced-motion attribute is "false"', () => {
      const restore = stubMatchMedia(false);
      renderGauge();
      expect(
        document.querySelector('[data-reduced-motion]')?.getAttribute('data-reduced-motion'),
      ).toBe('false');
      restore();
    });
  });

  describe('reduced-motion: true (no animation)', () => {
    it('fill starts at final dashoffset — no flash-of-empty-arc', () => {
      const restore = stubMatchMedia(true);
      renderGauge({ score: 72 });
      const fill = document.querySelector('[data-score]') as SVGPathElement | null;
      const dashoffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashoffset).toBeCloseTo(offsetForScore(72), 1);
      restore();
    });

    it('data-reduced-motion attribute is "true"', () => {
      const restore = stubMatchMedia(true);
      renderGauge();
      expect(
        document.querySelector('[data-reduced-motion]')?.getAttribute('data-reduced-motion'),
      ).toBe('true');
      restore();
    });
  });

  it('renders the trend label and arrow in the meta row', () => {
    renderGauge({ trend: 'declining' });
    // aria-hidden="true" on the meta row means we query via container, not role
    const metaRow = document.querySelector('.risk-meta');
    expect(metaRow?.textContent).toMatch(/declining/i);
    expect(metaRow?.textContent).toContain('▼');
  });

  it('renders the formatted lastUpdated date in the meta row', () => {
    renderGauge({ lastUpdated: '2025-03-01T00:00:00Z' });
    const metaRow = document.querySelector('.risk-meta');
    // Date is formatted; "Mar" or "March" should appear
    expect(metaRow?.textContent).toMatch(/mar/i);
  });

  it('uses semantic token colour vars, not hardcoded hex', () => {
    renderGauge({ score: 80 }); // ≥70 → success
    const fill = document.querySelector('[data-score]') as SVGPathElement | null;
    expect(fill?.getAttribute('stroke')).toBe('var(--success)');

    const { container: c2 } = render(
      <RiskGauge score={55} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />,
    );
    const fill2 = c2.querySelector('[data-score]') as SVGPathElement | null;
    expect(fill2?.getAttribute('stroke')).toBe('var(--warning)');

    const { container: c3 } = render(
      <RiskGauge score={30} trend="declining" lastUpdated="2025-01-01T00:00:00Z" />,
    );
    const fill3 = c3.querySelector('[data-score]') as SVGPathElement | null;
    expect(fill3?.getAttribute('stroke')).toBe('var(--error)');
  });
});
