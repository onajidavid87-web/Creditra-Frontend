import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TipJar } from './TipJar';
import { MOCK_CREDIT_LINES } from '../data/mockData';

describe('TipJar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mock data utilized values to original state before each test
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2024-001')!.utilized = 187500;
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2024-002')!.utilized = 210000;
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2023-003')!.utilized = 45000;
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2023-004')!.utilized = 75000;
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2022-005')!.utilized = 0;
    MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2025-006')!.utilized = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Tip Jar with the highest APR active/suspended line', () => {
    render(<TipJar />);
    
    // The highest APR active/suspended line with balance is "Working Capital Facility" (11.0%)
    // "Emergency Reserve Line" is 14.5% but is Defaulted, so it should be skipped.
    expect(screen.getByText('Credit Tip Jar')).toBeInTheDocument();
    expect(screen.getByText(/Working Capital Facility/)).toBeInTheDocument();
    expect(screen.getByText(/highest APR: 11/)).toBeInTheDocument();
  });

  it('handles a one-tap repayment successfully', async () => {
    const onRepaySuccess = vi.fn();
    render(<TipJar onRepaySuccess={onRepaySuccess} />);

    // Click the $25 button
    const btn25 = screen.getByRole('button', { name: /Repay \$25 immediately/i });
    fireEvent.click(btn25);

    // Verify it enters the processing state
    expect(screen.getByText('Processing Micro-Repayment')).toBeInTheDocument();
    expect(screen.getByText(/\$25/)).toBeInTheDocument();


    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Verify it enters the success state
    expect(screen.getByText('Repayment Confirmed!')).toBeInTheDocument();
    expect(screen.getByText(/Successfully repaid/i)).toHaveTextContent(
      'Successfully repaid $25 on Working Capital Facility. Your utilization has decreased.'
    );

    // Verify callback was called

    expect(onRepaySuccess).toHaveBeenCalledWith(25, 'Working Capital Facility');

    // Verify mock data was mutated (45000 - 25 = 44975)
    const line = MOCK_CREDIT_LINES.find(cl => cl.id === 'CL-2023-003');
    expect(line?.utilized).toBe(44975);
  });

  it('shows all caught up state when no active lines have a balance', () => {
    // Set all balances to 0
    MOCK_CREDIT_LINES.forEach(cl => {
      cl.utilized = 0;
    });

    render(<TipJar />);
    expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
    expect(screen.getByText(/You have no outstanding balances/i)).toBeInTheDocument();
  });
});
