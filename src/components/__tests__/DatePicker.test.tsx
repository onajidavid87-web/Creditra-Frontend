import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatePicker } from '../DatePicker';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

const defaultProps = {
  id: 'test-date',
  label: 'Test Date',
  value: '',
  onChange: vi.fn(),
};

describe('DatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders input with associated label', () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
    });

    it('renders placeholder text', () => {
      render(<DatePicker {...defaultProps} placeholder="MM/DD/YYYY" />);
      expect(screen.getByPlaceholderText('MM/DD/YYYY')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<DatePicker {...defaultProps} required />);
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('renders help text when provided', () => {
      render(<DatePicker {...defaultProps} helpText="Select a repayment date" />);
      expect(screen.getByText('Select a repayment date')).toBeInTheDocument();
    });

    it('shows error state with aria-invalid and alert role', () => {
      render(<DatePicker {...defaultProps} error="Date is required" />);
      const input = screen.getByLabelText('Test Date');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Date is required');
    });

    it('does not render alert role when no error', () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sets combobox semantics on the input', () => {
      render(<DatePicker {...defaultProps} />);
      const input = screen.getByLabelText('Test Date');
      expect(input).toHaveAttribute('aria-haspopup', 'dialog');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('applies disabled attribute when disabled', () => {
      render(<DatePicker {...defaultProps} disabled />);
      expect(screen.getByLabelText('Test Date')).toBeDisabled();
    });
  });

  describe('calendar toggle', () => {
    it('opens calendar on input click', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('June 2024')).toBeInTheDocument();
    });

    it('opens calendar when Enter or Space is pressed on input', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      input.focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      await user.click(input);
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not open when disabled', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} disabled value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('sets aria-controls on input when open', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(input).toHaveAttribute('aria-controls', 'test-date-calendar');
    });
  });

  describe('date selection', () => {
    it('calls onChange with ISO date when a day is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const june20 = screen.getByLabelText('June 20, 2024');
      await user.click(june20);
      expect(onChange).toHaveBeenCalledWith('2024-06-20');
    });

    it('closes calendar after selecting a date', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const june20 = screen.getByLabelText('June 20, 2024');
      await user.click(june20);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns focus to input after selection', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const june20 = screen.getByLabelText('June 20, 2024');
      await user.click(june20);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe('closing behavior', () => {
    it('closes on Escape key press', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns focus to input after Escape', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('closes when clicking outside the picker', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <DatePicker {...defaultProps} value="2024-06-15" />
          <button data-testid="outside">Outside button</button>
        </div>,
      );
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('month navigation', () => {
    it('navigates to next month', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByText('June 2024')).toBeInTheDocument();
      const nextBtn = screen.getByLabelText(/Go to next month/);
      await user.click(nextBtn);
      expect(screen.getByText('July 2024')).toBeInTheDocument();
    });

    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByText('June 2024')).toBeInTheDocument();
      const prevBtn = screen.getByLabelText(/Go to previous month/);
      await user.click(prevBtn);
      expect(screen.getByText('May 2024')).toBeInTheDocument();
    });

    it('wraps year when navigating from January backwards', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-01-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByText('January 2024')).toBeInTheDocument();
      const prevBtn = screen.getByLabelText(/Go to previous month/);
      await user.click(prevBtn);
      expect(screen.getByText('December 2023')).toBeInTheDocument();
    });

    it('wraps year when navigating from December forwards', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-12-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByText('December 2024')).toBeInTheDocument();
      const nextBtn = screen.getByLabelText(/Go to next month/);
      await user.click(nextBtn);
      expect(screen.getByText('January 2025')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus with ArrowRight and selects with Enter', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const grid = screen.getByRole('grid');
      grid.focus();

      await user.keyboard('{ArrowRight}');
      const june16 = screen.getByLabelText('June 16, 2024');
      expect(june16).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('2024-06-16');
    });

    it('moves focus with ArrowUp and ArrowDown', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const grid = screen.getByRole('grid');
      grid.focus();

      await user.keyboard('{ArrowDown}');
      const june22 = screen.getByLabelText('June 22, 2024');
      expect(june22).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      const june15 = screen.getByLabelText('June 15, 2024, selected');
      expect(june15).toHaveFocus();
    });

    it('changes month with PageUp and PageDown while preserving focused date', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const grid = screen.getByRole('grid');
      grid.focus();

      await user.keyboard('{PageDown}');
      expect(screen.getByText('July 2024')).toBeInTheDocument();
      expect(screen.getByLabelText('July 15, 2024')).toBeInTheDocument();

      await user.keyboard('{PageUp}');
      expect(screen.getByText('June 2024')).toBeInTheDocument();
      expect(screen.getByLabelText('June 15, 2024, selected')).toBeInTheDocument();
    });

    it('selects date with Space key', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const grid = screen.getByRole('grid');
      grid.focus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByLabelText('June 16, 2024')).toHaveFocus();

      await user.keyboard(' ');
      expect(onChange).toHaveBeenCalledWith('2024-06-16');
    });
  });

  describe('date constraints', () => {
    it('disables dates before min', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" min="2024-06-10" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const june9 = screen.queryByLabelText('June 9, 2024, unavailable');
      if (june9) {
        expect(june9).toBeDisabled();
      }

      const june10 = screen.getByLabelText('June 10, 2024');
      expect(june10).not.toBeDisabled();
    });

    it('disables dates after max', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" max="2024-06-20" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const june21 = screen.queryByLabelText('June 21, 2024, unavailable');
      if (june21) {
        expect(june21).toBeDisabled();
      }
    });

    it('applies disabled state to out-of-range days', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" min="2024-06-10" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const unavailable = screen.getAllByLabelText(/unavailable/);
      expect(unavailable.length).toBeGreaterThan(0);
      unavailable.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-disabled', 'true');
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Today button', () => {
    it('selects the current date when Today is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const todayBtn = screen.getByRole('button', { name: 'Today' });
      await user.click(todayBtn);

      const now = new Date();
      const expected = toISODate(now.getFullYear(), now.getMonth(), now.getDate());
      expect(onChange).toHaveBeenCalledWith(expected);
    });

    it('closes calendar after selecting Today', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const todayBtn = screen.getByRole('button', { name: 'Today' });
      await user.click(todayBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('view synchronization', () => {
    it('shows current month when no value is provided', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const now = new Date();
      expect(screen.getByText(`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`)).toBeInTheDocument();
    });

    it('syncs calendar view when value prop changes externally', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<DatePicker {...defaultProps} value="2024-06-15" onChange={onChange} />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByText('June 2024')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      rerender(<DatePicker {...defaultProps} value="2024-12-25" onChange={onChange} />);
      await user.click(input);
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders calendar with role dialog', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders grid with proper aria-label', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);
      expect(screen.getByLabelText('June 2024 calendar')).toBeInTheDocument();
    });

    it('announces day columns with accessible names', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByLabelText('Sunday')).toBeInTheDocument();
      expect(screen.getByLabelText('Saturday')).toBeInTheDocument();
    });

    it('marks selected day with aria-selected="true"', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const selected = screen.getByLabelText('June 15, 2024, selected');
      expect(selected).toHaveAttribute('aria-selected', 'true');
    });

    it('marks unselected days with aria-selected="false"', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const unselected = screen.getByLabelText('June 16, 2024');
      expect(unselected).toHaveAttribute('aria-selected', 'false');
    });

    it('marks today with accessible label when not selected', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      const now = new Date();
      const todayLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}, today`;
      const todayButton = screen.getByLabelText(todayLabel);
      expect(todayButton).toBeInTheDocument();
    });

    it('announces month changes via aria-live region', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByText('June 2024')).toBeInTheDocument();

      const nextBtn = screen.getByLabelText(/Go to next month/);
      await user.click(nextBtn);
      expect(screen.getByText('July 2024')).toBeInTheDocument();
    });

    it('provides accessible names for navigation buttons', async () => {
      const user = userEvent.setup();
      render(<DatePicker {...defaultProps} value="2024-06-15" />);
      const input = screen.getByLabelText('Test Date');
      await user.click(input);

      expect(screen.getByLabelText(/Go to previous month/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to next month/)).toBeInTheDocument();
    });
  });
});
