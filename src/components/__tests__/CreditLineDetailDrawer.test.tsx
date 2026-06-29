import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CreditLineDetailDrawer } from '../CreditLineDetailDrawer';
import type { CreditLine } from '../../types/creditLine';

// Mock hooks to avoid layout side-effects in test environment
vi.mock('../../hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('../../hooks/useInertBackdrop', () => ({
  useInertBackdrop: vi.fn(),
}));

describe('CreditLineDetailDrawer', () => {
  const mockOnClose = vi.fn();

  const mockCreditLine: CreditLine = {
    id: 'CL-TEST-001',
    name: 'Test Business Facility',
    status: 'Active',
    limit: 100000,
    utilized: 40000,
    apr: 8.5,
    riskScore: 710,
    collateral: 'Accounts Receivable',
    openedAt: '2024-03-15',
    updatedAt: '2025-02-20T14:32:00Z',
    nextPaymentDate: '2025-03-01',
    nextPaymentAmount: 1500,
    transactions: [
      {
        id: 'TX-TEST-001',
        type: 'Draw',
        amount: 40000,
        date: '2025-02-18T10:30:00Z',
        note: 'Purchase inventory',
        status: 'Completed',
        txHash: '0xabc123',
      },
      {
        id: 'TX-TEST-002',
        type: 'Repay',
        amount: 10000,
        date: '2025-02-10T14:15:00Z',
        note: 'Repayment',
        status: 'Completed',
      },
    ],
    statusHistory: [
      { status: 'Active', date: '2024-03-15', note: 'Line opened' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credit line details correctly', () => {
    render(<CreditLineDetailDrawer line={mockCreditLine} onClose={mockOnClose} />);

    // Renders header information
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Business Facility')).toBeInTheDocument();
    expect(screen.getByText('CL-TEST-001')).toBeInTheDocument();

    // Renders badge
    expect(screen.getByLabelText('Credit line status: Active')).toBeInTheDocument();

    // Renders key metrics
    // $100,000 limit, $40,000 utilized, $60,000 available
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('$40,000')).toBeInTheDocument();
    expect(screen.getByText('$60,000')).toBeInTheDocument();
    expect(screen.getByText('8.50% APR')).toBeInTheDocument();

    // Renders progress bar level
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');

    // Facility details
    expect(screen.getByText('710')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
  });

  it('renders inline SVG sparkline and transaction history', () => {
    render(<CreditLineDetailDrawer line={mockCreditLine} onClose={mockOnClose} />);

    // Sparkline trend is rendered
    expect(screen.getByLabelText('Sparkline showing credit line balance history')).toBeInTheDocument();

    // Transactions list
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Repay')).toBeInTheDocument();
    expect(screen.getByText('Purchase inventory')).toBeInTheDocument();
    expect(screen.getByText('-$40,000')).toBeInTheDocument();
    expect(screen.getByText('+$10,000')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    render(<CreditLineDetailDrawer line={mockCreditLine} onClose={mockOnClose} />);

    const closeBtn = screen.getByLabelText('Close details drawer');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<CreditLineDetailDrawer line={mockCreditLine} onClose={mockOnClose} />);

    // Fire keydown Escape on document/dialog container
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });

    // FocusTrap handles Escape internally and should trigger onClose
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
