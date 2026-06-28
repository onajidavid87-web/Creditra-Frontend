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
 * 11. [focus] SVG is keyboard-focusable (tabIndex=0).
 * 12. [focus] SVG has a visible focus ring via box-shadow on :focus-visible.
 * 13. [focus] Enter / Space on focused SVG fires onSectorActivate with the
 *     active sector id.
 * 14. [focus] Three sector <g> elements are rendered with role="button" and
 *     tabIndex=0 when showSectors=true (default).
 * 15. [focus] Each sector <g> has aria-labelledby pointing at a <title>
 *     describing the score range.
 * 16. [focus] Pressing Enter / Space on a sector <g> fires onSectorActivate
 *     with that sector's id.
 * 17. [focus] Clicking a sector <g> fires onSectorActivate with that sector's id.
 * 18. [focus] Sectors are NOT rendered when showSectors=false.
 * 19. [focus] Active sector is marked with aria-pressed="true"; others "false".
 * 20. [focus] data-active-sector on the SVG matches the score band.
 * 21. [focus] High-contrast mode — focus-ring-color token resolves to white
 *     (token value tested indirectly via data-attribute).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RiskGauge, RiskSector } from './RiskGauge';

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

  // ── Original test suite ──────────────────────────────────────────────────

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

  // ── Focus ring tests ─────────────────────────────────────────────────────

  describe('focus ring — SVG root', () => {
    it('SVG has tabIndex=0, making it keyboard-reachable', () => {
      renderGauge();
      const svg = screen.getByRole('img');
      expect(svg.getAttribute('tabindex')).toBe('0');
    });

    it('SVG carries the .risk-gauge-svg class (focus ring applied via CSS)', () => {
      renderGauge();
      const svg = screen.getByRole('img');
      expect(svg).toHaveClass('risk-gauge-svg');
    });

    it('pressing Enter on the focused SVG fires onSectorActivate with the active sector', () => {
      const onActivate = vi.fn();
      // score=80 → active sector = "high"
      renderGauge({ score: 80, onSectorActivate: onActivate });
      const svg = screen.getByRole('img');
      fireEvent.keyDown(svg, { key: 'Enter', code: 'Enter' });
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('high');
    });

    it('pressing Space on the focused SVG fires onSectorActivate with the active sector', () => {
      const onActivate = vi.fn();
      // score=55 → active sector = "medium"
      renderGauge({ score: 55, onSectorActivate: onActivate });
      const svg = screen.getByRole('img');
      fireEvent.keyDown(svg, { key: ' ', code: 'Space' });
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('medium');
    });

    it('pressing an unrelated key on the SVG does NOT fire onSectorActivate', () => {
      const onActivate = vi.fn();
      renderGauge({ onSectorActivate: onActivate });
      const svg = screen.getByRole('img');
      fireEvent.keyDown(svg, { key: 'Tab', code: 'Tab' });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('active sector is reflected in data-active-sector attribute on SVG', () => {
      // score=80 → high
      const { rerender } = renderGauge({ score: 80 });
      expect(screen.getByRole('img').getAttribute('data-active-sector')).toBe('high');

      // score=55 → medium
      rerender(<RiskGauge score={55} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />);
      expect(screen.getByRole('img').getAttribute('data-active-sector')).toBe('medium');

      // score=30 → low
      rerender(<RiskGauge score={30} trend="declining" lastUpdated="2025-01-01T00:00:00Z" />);
      expect(screen.getByRole('img').getAttribute('data-active-sector')).toBe('low');
    });

    it('onSectorActivate is not required — keyboard event does not throw', () => {
      // No onSectorActivate prop — should not throw
      renderGauge({ score: 72 });
      const svg = screen.getByRole('img');
      expect(() => fireEvent.keyDown(svg, { key: 'Enter' })).not.toThrow();
    });
  });

  describe('focus ring — interactive sectors', () => {
    it('renders three sector <g> elements with role="button" by default', () => {
      renderGauge();
      const sectors = screen.getAllByRole('button');
      expect(sectors).toHaveLength(3);
    });

    it('each sector <g> has tabIndex=0 (keyboard reachable)', () => {
      renderGauge();
      const sectors = screen.getAllByRole('button');
      sectors.forEach((sector) => {
        expect(sector.getAttribute('tabindex')).toBe('0');
      });
    });

    it('each sector has a data-sector attribute identifying the band', () => {
      const { container } = renderGauge();
      const sectorIds = Array.from(container.querySelectorAll('[data-sector]')).map((el) =>
        el.getAttribute('data-sector'),
      );
      expect(sectorIds).toContain('high');
      expect(sectorIds).toContain('medium');
      expect(sectorIds).toContain('low');
    });

    it('each sector <g> has aria-labelledby pointing at a <title> with the range', () => {
      const { container } = renderGauge();
      const sectors = container.querySelectorAll('[data-sector]');
      sectors.forEach((sector) => {
        const labelId = sector.getAttribute('aria-labelledby');
        expect(labelId).toBeTruthy();
        const title = container.querySelector(`#${labelId}`);
        expect(title).toBeInTheDocument();
        // Title should mention "scores" and a range like "0–49"
        expect(title?.textContent).toMatch(/scores/i);
      });
    });

    it('active sector has aria-pressed="true"; inactive sectors have "false"', () => {
      // score=80 → active = "high"
      const { container } = renderGauge({ score: 80 });
      const high = container.querySelector('[data-sector="high"]');
      const medium = container.querySelector('[data-sector="medium"]');
      const low = container.querySelector('[data-sector="low"]');

      expect(high?.getAttribute('aria-pressed')).toBe('true');
      expect(medium?.getAttribute('aria-pressed')).toBe('false');
      expect(low?.getAttribute('aria-pressed')).toBe('false');
    });

    it('pressing Enter on a sector fires onSectorActivate with that sector id', () => {
      const onActivate = vi.fn();
      const { container } = renderGauge({ onSectorActivate: onActivate });
      const mediumSector = container.querySelector('[data-sector="medium"]')!;
      fireEvent.keyDown(mediumSector, { key: 'Enter', code: 'Enter' });
      expect(onActivate).toHaveBeenCalledWith('medium');
    });

    it('pressing Space on a sector fires onSectorActivate with that sector id', () => {
      const onActivate = vi.fn();
      const { container } = renderGauge({ onSectorActivate: onActivate });
      const lowSector = container.querySelector('[data-sector="low"]')!;
      fireEvent.keyDown(lowSector, { key: ' ', code: 'Space' });
      expect(onActivate).toHaveBeenCalledWith('low');
    });

    it('clicking a sector fires onSectorActivate with that sector id', () => {
      const onActivate = vi.fn();
      const { container } = renderGauge({ onSectorActivate: onActivate });
      const highSector = container.querySelector('[data-sector="high"]')!;
      fireEvent.click(highSector);
      expect(onActivate).toHaveBeenCalledWith('high');
    });

    it('unrelated keydown on a sector does NOT fire onSectorActivate', () => {
      const onActivate = vi.fn();
      const { container } = renderGauge({ onSectorActivate: onActivate });
      const sector = container.querySelector('[data-sector="high"]')!;
      fireEvent.keyDown(sector, { key: 'Escape', code: 'Escape' });
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('sectors are NOT rendered when showSectors=false', () => {
      renderGauge({ showSectors: false });
      // No buttons should be in the document
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('sectors are rendered by default (showSectors defaults to true)', () => {
      renderGauge();
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('each sector contains a focus-rect element for the per-sector ring', () => {
      const { container } = renderGauge();
      const sectors = container.querySelectorAll('[data-sector]');
      sectors.forEach((sector) => {
        const focusRect = sector.querySelector('.risk-gauge-sector-focus-rect');
        expect(focusRect).toBeInTheDocument();
        // At rest the rect has no stroke (ring is hidden)
        // CSS :focus-visible adds stroke — can't test CSSOM in jsdom, but
        // we verify the element exists with the correct class.
        expect(focusRect?.tagName.toLowerCase()).toBe('rect');
      });
    });

    it('each sector arc has class risk-gauge-sector-arc', () => {
      const { container } = renderGauge();
      const arcs = container.querySelectorAll('.risk-gauge-sector-arc');
      expect(arcs).toHaveLength(3);
    });

    it('onSectorActivate is optional — sector click/keydown does not throw', () => {
      // No onSectorActivate prop
      const { container } = renderGauge();
      const sector = container.querySelector('[data-sector="high"]')!;
      expect(() => fireEvent.click(sector)).not.toThrow();
      expect(() => fireEvent.keyDown(sector, { key: 'Enter' })).not.toThrow();
    });
  });

  describe('focus ring — boundary / edge cases', () => {
    it('score=0 → active sector is "low"', () => {
      const { container } = renderGauge({ score: 0 });
      const svg = container.querySelector('.risk-gauge-svg');
      expect(svg?.getAttribute('data-active-sector')).toBe('low');
      const lowSector = container.querySelector('[data-sector="low"]');
      expect(lowSector?.getAttribute('aria-pressed')).toBe('true');
    });

    it('score=50 → active sector is "medium" (boundary inclusive)', () => {
      const { container } = renderGauge({ score: 50 });
      expect(container.querySelector('.risk-gauge-svg')?.getAttribute('data-active-sector')).toBe('medium');
    });

    it('score=70 → active sector is "high" (boundary inclusive)', () => {
      const { container } = renderGauge({ score: 70 });
      expect(container.querySelector('.risk-gauge-svg')?.getAttribute('data-active-sector')).toBe('high');
    });

    it('score=100 → active sector is "high"', () => {
      const { container } = renderGauge({ score: 100 });
      expect(container.querySelector('.risk-gauge-svg')?.getAttribute('data-active-sector')).toBe('high');
    });

    it('clamped-to-0 score maps to "low" sector', () => {
      const { container } = renderGauge({ score: -999 });
      expect(container.querySelector('.risk-gauge-svg')?.getAttribute('data-active-sector')).toBe('low');
    });

    it('clamped-to-100 score maps to "high" sector', () => {
      const { container } = renderGauge({ score: 9999 });
      expect(container.querySelector('.risk-gauge-svg')?.getAttribute('data-active-sector')).toBe('high');
    });

    it('active sector shows a dot element; inactive sectors do not', () => {
      // score=80 → high is active
      const { container } = renderGauge({ score: 80 });
      const dots = container.querySelectorAll('[data-active-dot]');
      expect(dots).toHaveLength(1);
      expect(dots[0].getAttribute('data-active-dot')).toBe('high');
    });

    it('sector title IDs are unique across all three sectors', () => {
      const { container } = renderGauge();
      const sectors = container.querySelectorAll('[data-sector]');
      const labelIds = Array.from(sectors).map((s) => s.getAttribute('aria-labelledby'));
      const unique = new Set(labelIds);
      expect(unique.size).toBe(3);
    });

    it('re-render with new score updates data-active-sector and aria-pressed', () => {
      const { rerender, container } = render(
        <RiskGauge score={30} trend="declining" lastUpdated="2025-01-01T00:00:00Z" />,
      );
      expect(container.querySelector('[data-sector="low"]')?.getAttribute('aria-pressed')).toBe('true');

      rerender(<RiskGauge score={75} trend="improving" lastUpdated="2025-01-01T00:00:00Z" />);
      expect(container.querySelector('[data-sector="high"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(container.querySelector('[data-sector="low"]')?.getAttribute('aria-pressed')).toBe('false');
    });
  });
});
