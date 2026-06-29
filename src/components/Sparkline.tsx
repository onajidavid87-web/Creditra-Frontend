import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'var(--accent, #4F46E5)',
  strokeWidth = 2,
  className = '',
  ariaLabel = '30-day risk trend',
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = strokeWidth;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((d - min) / range) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`sparkline-container ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      {/* SR table fallback */}
      <table className="sr-only" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>Day {i + 1}</td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
