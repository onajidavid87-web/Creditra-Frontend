/**
 * RepaymentVisualizer
 *
 * Renders a stacked area chart (principal vs interest) for a repayment schedule,
 * with an accessible SR-fallback data table and hover/long-press tooltip.
 *
 * Approach:
 *  - Pure SVG — no third-party charting library.
 *  - Theme tokens from CSS custom properties; colours from src/utils/tokens.ts.
 *  - WCAG 2.1 AA: focus ring, aria-label, role="img", table fallback, reduced-motion.
 */

import { useState, useRef, useCallback, useId } from 'react';
import { COLOR } from '@/utils/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleRow {
  /** 1-based month number */
  month: number;
  /** Remaining principal at end of month */
  principal: number;
  /** Cumulative interest paid to end of month */
  cumulativeInterest: number;
  /** Interest component of this month's payment */
  interest: number;
  /** Principal component of this month's payment */
  principalPaid: number;
}

export interface RepaymentVisualizerProps {
  /** Outstanding debt at start */
  principal: number;
  /** Annual percentage rate (e.g. 8.5 for 8.5 %) */
  apr: number;
  /** Fixed monthly payment */
  monthlyPayment: number;
  /** Max months to project (capped at 360) */
  maxMonths?: number;
}

// ─── Schedule generator ────────────────────────────────────────────────────────

function buildSchedule(
  principal: number,
  apr: number,
  monthlyPayment: number,
  maxMonths: number,
): ScheduleRow[] {
  if (principal <= 0 || monthlyPayment <= 0) return [];

  const monthlyRate = apr / 100 / 12;
  let remaining = principal;
  let cumInterest = 0;
  const rows: ScheduleRow[] = [];

  for (let m = 1; m <= maxMonths && remaining > 0; m++) {
    const interest = remaining * monthlyRate;
    const principalPaid = Math.min(monthlyPayment - interest, remaining);
    cumInterest += interest;
    remaining = Math.max(0, remaining - principalPaid);

    rows.push({
      month: m,
      principal: remaining,
      cumulativeInterest: cumInterest,
      interest,
      principalPaid: Math.max(0, principalPaid),
    });

    if (remaining <= 0) break;
  }

  return rows;
}

// ─── SVG chart ────────────────────────────────────────────────────────────────

const W = 600;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 56 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function toPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface TooltipData {
  month: number;
  principal: number;
  cumulativeInterest: number;
  x: number;
  y: number;
}

interface ChartProps {
  schedule: ScheduleRow[];
  tooltipId: string;
  onTooltip: (data: TooltipData | null) => void;
  tooltip: TooltipData | null;
}

function StackedAreaChart({ schedule, tooltipId, onTooltip, tooltip }: ChartProps) {
  if (schedule.length === 0) return null;

  const initPrincipal = schedule[0].principal + schedule[0].principalPaid;
  const maxStack = initPrincipal + (schedule[schedule.length - 1]?.cumulativeInterest ?? 0);

  const xScale = (i: number) => PAD.left + (i / (schedule.length - 1 || 1)) * CHART_W;
  const yScale = (v: number) => PAD.top + CHART_H - (v / maxStack) * CHART_H;

  // Area 1: principal remaining (bottom area)
  const principalTop: [number, number][] = schedule.map((r, i) => [xScale(i), yScale(r.principal)]);
  const principalBase: [number, number][] = [
    [xScale(schedule.length - 1), yScale(0)],
    [xScale(0), yScale(0)],
  ];
  const principalPath = `${toPath(principalTop)} ${toPath(principalBase)} Z`;

  // Area 2: cumulative interest (stacked on top of principal)
  const interestTop: [number, number][] = schedule.map((r, i) => [
    xScale(i),
    yScale(r.principal + r.cumulativeInterest),
  ]);
  const interestBase: [number, number][] = [...principalTop].reverse();
  const interestPath = `${toPath(interestTop)} ${toPath(interestBase)} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: maxStack * f,
    y: yScale(maxStack * f),
  }));

  // X-axis ticks (up to 6)
  const xTickCount = Math.min(schedule.length, 6);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1 || 1)) * (schedule.length - 1));
    return { month: schedule[idx].month, x: xScale(idx) };
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const relX = svgX - PAD.left;
      const idx = Math.round((relX / CHART_W) * (schedule.length - 1));
      const clamped = Math.max(0, Math.min(idx, schedule.length - 1));
      const row = schedule[clamped];
      onTooltip({
        month: row.month,
        principal: row.principal,
        cumulativeInterest: row.cumulativeInterest,
        x: xScale(clamped),
        y: yScale(row.principal + row.cumulativeInterest),
      });
    },
    [schedule, xScale, yScale, onTooltip],
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Stacked area chart showing principal and cumulative interest over repayment months"
      aria-describedby={tooltipId}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onTooltip(null)}
      onTouchEnd={() => onTooltip(null)}
    >
      <defs>
        <linearGradient id="grad-principal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLOR.accent} stopOpacity="0.7" />
          <stop offset="100%" stopColor={COLOR.accent} stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="grad-interest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLOR.warning} stopOpacity="0.7" />
          <stop offset="100%" stopColor={COLOR.warning} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map(({ y, value }) => (
        <g key={value}>
          <line
            x1={PAD.left}
            y1={y}
            x2={W - PAD.right}
            y2={y}
            stroke={COLOR.border}
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <text
            x={PAD.left - 6}
            y={y + 4}
            textAnchor="end"
            fontSize="10"
            fill={COLOR.muted}
          >
            {fmtK(value)}
          </text>
        </g>
      ))}

      {/* Interest area (painted first — sits below principal visually in stacking) */}
      <path d={interestPath} fill="url(#grad-interest)" />
      {/* Principal area */}
      <path d={principalPath} fill="url(#grad-principal)" />

      {/* X-axis ticks */}
      {xTicks.map(({ month, x }) => (
        <text key={month} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill={COLOR.muted}>
          mo {month}
        </text>
      ))}

      {/* Tooltip crosshair */}
      {tooltip && (
        <g>
          <line
            x1={tooltip.x}
            y1={PAD.top}
            x2={tooltip.x}
            y2={PAD.top + CHART_H}
            stroke={COLOR.border}
            strokeWidth="1"
          />
          <circle cx={tooltip.x} cy={yScale(tooltip.principal)} r="4" fill={COLOR.accent} />
          <circle
            cx={tooltip.x}
            cy={yScale(tooltip.principal + tooltip.cumulativeInterest)}
            r="4"
            fill={COLOR.warning}
          />
        </g>
      )}
    </svg>
  );
}

// ─── Tooltip bubble ────────────────────────────────────────────────────────────

function TooltipBubble({ data }: { data: TooltipData }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--surface-raised, #1c2230)',
        border: `1px solid var(--border, ${COLOR.border})`,
        borderRadius: 8,
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        color: `var(--text, ${COLOR.text})`,
        pointerEvents: 'none',
        minWidth: 160,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Month {data.month}</p>
      <p style={{ color: `var(--accent, ${COLOR.accent})` }}>
        Principal remaining: {fmt(data.principal)}
      </p>
      <p style={{ color: `var(--warning, ${COLOR.warning})` }}>
        Cumulative interest: {fmt(data.cumulativeInterest)}
      </p>
    </div>
  );
}

// ─── SR table fallback ─────────────────────────────────────────────────────────

function SRTable({ schedule }: { schedule: ScheduleRow[] }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  // Limit visible rows; full table always in SR tree
  return (
    <table
      className="sr-only"
      aria-label="Repayment schedule data table"
      style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem' }}
    >
      <caption className="sr-only">Monthly repayment schedule: principal and interest breakdown</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Principal Paid</th>
          <th scope="col">Interest Paid</th>
          <th scope="col">Remaining Principal</th>
          <th scope="col">Cumulative Interest</th>
        </tr>
      </thead>
      <tbody>
        {schedule.map((row) => (
          <tr key={row.month}>
            <td>{row.month}</td>
            <td>{fmt(row.principalPaid)}</td>
            <td>{fmt(row.interest)}</td>
            <td>{fmt(row.principal)}</td>
            <td>{fmt(row.cumulativeInterest)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: `var(--muted, ${COLOR.muted})` }}
      aria-hidden="true"
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{ width: 12, height: 12, borderRadius: 2, background: COLOR.accent, display: 'inline-block' }}
        />
        Principal remaining
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{ width: 12, height: 12, borderRadius: 2, background: COLOR.warning, display: 'inline-block' }}
        />
        Cumulative interest
      </span>
    </div>
  );
}

// ─── Visible fallback table (non-SR) ──────────────────────────────────────────

interface VisibleTableProps {
  schedule: ScheduleRow[];
  limit?: number;
}

function VisibleTable({ schedule, limit = 12 }: VisibleTableProps) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? schedule : schedule.slice(0, limit);
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  const thStyle: React.CSSProperties = {
    textAlign: 'right',
    padding: '6px 8px',
    fontWeight: 600,
    fontSize: '0.7rem',
    color: `var(--muted, ${COLOR.muted})`,
    borderBottom: `1px solid var(--border, ${COLOR.border})`,
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    textAlign: 'right',
    padding: '5px 8px',
    fontSize: '0.75rem',
    color: `var(--text, ${COLOR.text})`,
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-label="Repayment schedule"
        style={{ borderCollapse: 'collapse', width: '100%', minWidth: 460 }}
      >
        <thead>
          <tr>
            <th scope="col" style={{ ...thStyle, textAlign: 'left' }}>Month</th>
            <th scope="col" style={thStyle}>Principal Paid</th>
            <th scope="col" style={thStyle}>Interest</th>
            <th scope="col" style={thStyle}>Remaining</th>
            <th scope="col" style={thStyle}>Cum. Interest</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.month}
              style={{ background: i % 2 === 0 ? 'transparent' : `var(--surface, ${COLOR.surface})` }}
            >
              <td style={{ ...tdStyle, textAlign: 'left', color: `var(--muted, ${COLOR.muted})` }}>
                {row.month}
              </td>
              <td style={{ ...tdStyle, color: `var(--accent, ${COLOR.accent})` }}>
                {fmt(row.principalPaid)}
              </td>
              <td style={{ ...tdStyle, color: `var(--warning, ${COLOR.warning})` }}>
                {fmt(row.interest)}
              </td>
              <td style={tdStyle}>{fmt(row.principal)}</td>
              <td style={tdStyle}>{fmt(row.cumulativeInterest)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {schedule.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: `var(--accent, ${COLOR.accent})`,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
          }}
          aria-expanded={showAll}
        >
          {showAll ? 'Show fewer rows' : `Show all ${schedule.length} months`}
        </button>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <p
      style={{
        textAlign: 'center',
        padding: '2rem',
        color: `var(--muted, ${COLOR.muted})`,
        fontSize: '0.875rem',
      }}
    >
      Enter a valid principal, APR, and monthly payment to see the repayment plan.
    </p>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * RepaymentVisualizer displays a stacked area chart (principal vs cumulative
 * interest) over the life of a loan, plus an accessible data table.
 */
export function RepaymentVisualizer({
  principal,
  apr,
  monthlyPayment,
  maxMonths = 360,
}: RepaymentVisualizerProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const tooltipId = useId();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = buildSchedule(principal, apr, monthlyPayment, maxMonths);

  // Long-press for mobile tooltip
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      longPressTimer.current = setTimeout(() => {
        // approximate index from touch position
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        const idx = Math.round((relX / rect.width) * (schedule.length - 1));
        const clamped = Math.max(0, Math.min(idx, schedule.length - 1));
        const row = schedule[clamped];
        if (row) {
          setTooltip({
            month: row.month,
            principal: row.principal,
            cumulativeInterest: row.cumulativeInterest,
            x: 0,
            y: 0,
          });
        }
      }, 400);
    },
    [schedule],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const totalInterest = schedule[schedule.length - 1]?.cumulativeInterest ?? 0;
  const termMonths = schedule.length;

  return (
    <section
      aria-label="Repayment plan visualizer"
      style={{
        background: `var(--surface, ${COLOR.surface})`,
        border: `1px solid var(--border, ${COLOR.border})`,
        borderRadius: 10,
        padding: '1.25rem',
      }}
    >
      <header style={{ marginBottom: '1rem' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: `var(--text, ${COLOR.text})`,
            margin: 0,
          }}
        >
          Repayment Plan
        </h2>
        {schedule.length > 0 && (
          <p style={{ fontSize: '0.8rem', color: `var(--muted, ${COLOR.muted})`, marginTop: 4 }}>
            {termMonths} month{termMonths !== 1 ? 's' : ''} ·{' '}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(totalInterest)}{' '}
            total interest
          </p>
        )}
      </header>

      {schedule.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Chart */}
          <div
            style={{ position: 'relative' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <StackedAreaChart
              schedule={schedule}
              tooltipId={tooltipId}
              onTooltip={setTooltip}
              tooltip={tooltip}
            />

            {/* Tooltip bubble — positioned absolutely over chart */}
            {tooltip && (
              <div
                id={tooltipId}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                }}
              >
                <TooltipBubble data={tooltip} />
              </div>
            )}
          </div>

          <Legend />

          {/* SR-only full data table (always present for assistive tech) */}
          <SRTable schedule={schedule} />

          {/* Visible table */}
          <details style={{ marginTop: '1rem' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: `var(--accent, ${COLOR.accent})`,
                userSelect: 'none',
                padding: '4px 0',
                outline: 'none',
              }}
              // Focus ring via global focus.css
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Schedule table
            </summary>
            <div style={{ marginTop: '0.5rem' }}>
              <VisibleTable schedule={schedule} />
            </div>
          </details>
        </>
      )}
    </section>
  );
}
