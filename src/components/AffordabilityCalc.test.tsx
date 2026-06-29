import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AffordabilityCalc, calcMaxAffordable, DEBT_RATIO } from './AffordabilityCalc';

// ─── Pure function ────────────────────────────────────────────────────────────

describe('calcMaxAffordable', () => {
  it('applies the 36 % debt ratio', () => {
    expect(calcMaxAffordable(10000, 0)).toBeCloseTo(10000 * DEBT_RATIO);
  });

  it('subtracts existing obligations', () => {
    expect(calcMaxAffordable(10000, 1000)).toBeCloseTo(10000 * DEBT_RATIO - 1000);
  });

  it('clamps to 0 when obligations exceed the cap', () => {
    expect(calcMaxAffordable(1000, 5000)).toBe(0);
  });

  it('returns 0 for zero income', () => {
    expect(calcMaxAffordable(0, 0)).toBe(0);
  });
});

// ─── Component ────────────────────────────────────────────────────────────────

function renderCalc(onApply?: (n: number) => void) {
  return render(<AffordabilityCalc onApply={onApply} />);
}

describe('AffordabilityCalc component', () => {
  it('renders income and obligations inputs', () => {
    renderCalc();
    expect(screen.getByLabelText(/monthly income/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly obligations/i)).toBeInTheDocument();
  });

  it('does not show a result before income is entered', () => {
    renderCalc();
    // The result region only mounts when income > 0
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the result after income is entered', () => {
    renderCalc();
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '10000' },
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/max affordable repayment/i)).toBeInTheDocument();
  });

  it('computes the correct max affordable amount', () => {
    renderCalc();
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '10000' },
    });
    fireEvent.change(screen.getByLabelText(/monthly obligations/i), {
      target: { value: '1000' },
    });
    // 10000 * 0.36 - 1000 = 2600
    expect(screen.getByRole('status')).toHaveTextContent('$2,600');
  });

  it('shows 0 when obligations exceed the DTI cap', () => {
    renderCalc();
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText(/monthly obligations/i), {
      target: { value: '5000' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('$0');
  });

  it('renders "Use this amount" button when onApply is provided', () => {
    renderCalc(vi.fn());
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '10000' },
    });
    expect(screen.getByRole('button', { name: /use this amount/i })).toBeInTheDocument();
  });

  it('does not render "Use this amount" button without onApply', () => {
    renderCalc();
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '10000' },
    });
    expect(screen.queryByRole('button', { name: /use this amount/i })).not.toBeInTheDocument();
  });

  it('calls onApply with the computed max when the button is clicked', () => {
    const onApply = vi.fn();
    renderCalc(onApply);
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '10000' },
    });
    fireEvent.change(screen.getByLabelText(/monthly obligations/i), {
      target: { value: '1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /use this amount/i }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(2600);
  });

  it('has a visible focus ring class on inputs', () => {
    renderCalc();
    const incomeInput = screen.getByLabelText(/monthly income/i);
    expect(incomeInput.className).toContain('focus:ring-2');
    expect(incomeInput.className).toContain('focus:ring-accent');
  });

  it('has the tooltip trigger in the document', () => {
    renderCalc();
    // AccessibleTooltip renders a trigger span with aria-label="More information"
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
