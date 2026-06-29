import React from 'react';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';
import { describe, it, expect } from 'vitest';

describe('Sparkline', () => {
  it('renders SVG and a screen-reader table', () => {
    const data = [10, 20, 30, 40, 50];
    const { container, getByRole, getAllByRole } = render(<Sparkline data={data} />);

    // SVG should be rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Polyline should have correct number of points (not exact match needed, just checking it exists)
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();

    // Table should be rendered and accessible via screen reader
    const table = getByRole('table', { hidden: true });
    expect(table).toHaveClass('sr-only');
    expect(table).toHaveAttribute('aria-label', '30-day risk trend');

    // Should render headers and row for each data point
    const rows = getAllByRole('row', { hidden: true });
    // 1 header row + 5 data rows = 6 rows
    expect(rows.length).toBe(6);
  });

  it('renders nothing when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
