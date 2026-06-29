import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CreditLines from '../CreditLines';

vi.mock('../../data/mockData', () => ({
  MOCK_CREDIT_LINES: [
    {
      id: 'CL-001',
      name: 'Test Active Line',
      status: 'Active',
      limit: 100000,
      utilized: 0,
      apr: 8.5,
      riskScore: 700,
      collateral: 'ETH',
      openedAt: '2025-01-01',
      updatedAt: '2025-06-01T00:00:00Z',
      transactions: [],
      statusHistory: [],
    },
  ],
}));

function getStatusSelect() {
  return screen.getAllByRole('combobox')[0];
}

describe('CreditLines — empty state (issue #313)', () => {
  describe('no filter results', () => {
    it('shows no-matches guidance when filter excludes all lines', async () => {
      const user = userEvent.setup();
      render(<MemoryRouter><CreditLines /></MemoryRouter>);
      await user.selectOptions(getStatusSelect(), 'Defaulted');
      expect(screen.getByText('No matching credit lines')).toBeInTheDocument();
    });

    it('renders the Clear Filters button when no matches', async () => {
      const user = userEvent.setup();
      render(<MemoryRouter><CreditLines /></MemoryRouter>);
      await user.selectOptions(getStatusSelect(), 'Defaulted');
      expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
    });

    it('clears filters when Clear Filters is clicked', async () => {
      const user = userEvent.setup();
      render(<MemoryRouter><CreditLines /></MemoryRouter>);
      await user.selectOptions(getStatusSelect(), 'Defaulted');
      await user.click(screen.getByRole('button', { name: 'Clear Filters' }));
      expect(screen.getByText('Test Active Line')).toBeInTheDocument();
    });

    it('sets the region aria-label for accessibility', async () => {
      const user = userEvent.setup();
      render(<MemoryRouter><CreditLines /></MemoryRouter>);
      await user.selectOptions(getStatusSelect(), 'Defaulted');
      expect(screen.getByRole('region', { name: 'No matching credit lines' })).toBeInTheDocument();
    });
  });
});
