import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepaymentVisualizer } from '../RepaymentVisualizer';

const BASE = {
  principal: 100_000,
  apr: 8.5,
  monthlyPayment: 2500,
};

describe('RepaymentVisualizer', () => {
  it('renders the section heading', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getByRole('region', { name: 'Repayment plan visualizer' })).toBeInTheDocument();
    expect(screen.getByText('Repayment Plan')).toBeInTheDocument();
  });

  it('shows empty state when principal is 0', () => {
    render(<RepaymentVisualizer {...BASE} principal={0} />);
    expect(
      screen.getByText(/Enter a valid principal/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when monthlyPayment is 0', () => {
    render(<RepaymentVisualizer {...BASE} monthlyPayment={0} />);
    expect(screen.getByText(/Enter a valid principal/i)).toBeInTheDocument();
  });

  it('renders the SVG chart with accessible role', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders term and total interest summary', () => {
    render(<RepaymentVisualizer {...BASE} />);
    // summary line contains "months" and "$X total interest"
    expect(screen.getByText(/month/i)).toBeInTheDocument();
    expect(screen.getByText(/total interest/i)).toBeInTheDocument();
  });

  it('renders the SR-only data table with correct headers', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const tables = screen.getAllByRole('table');
    // At least one table (SR table always present)
    expect(tables.length).toBeGreaterThanOrEqual(1);
    // SR table has required column headers
    expect(screen.getAllByRole('columnheader', { name: /Month/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('columnheader', { name: /Interest/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('columnheader', { name: /Principal/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders a legend with principal and interest labels', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getByText(/Principal remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Cumulative interest/i)).toBeInTheDocument();
  });

  it('schedule table toggle expands visible rows', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const summary = screen.getByText(/Schedule table/i);
    // Open details
    fireEvent.click(summary);
    // Should now show a "Show all" button or visible table rows
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(2);
  });

  it('caps term at maxMonths', () => {
    // Very low payment — would take forever; capped at maxMonths=6
    render(<RepaymentVisualizer principal={100_000} apr={8.5} monthlyPayment={3000} maxMonths={6} />);
    expect(screen.getByText(/6 month/)).toBeInTheDocument();
  });

  it('has no tooltip by default', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse move over SVG', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    // Simulate mousemove — jsdom won't compute getBoundingClientRect but fires the handler
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
    // Tooltip should appear (role="status" aria-live)
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Month/)).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.mouseLeave(svg);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
