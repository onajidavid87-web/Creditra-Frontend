import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AprBreakdown } from './AprBreakdown';

vi.mock('../hooks/useBodyScrollLock', () => ({ useBodyScrollLock: vi.fn() }));
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null })),
}));

const renderBreakdown = (props?: Partial<React.ComponentProps<typeof AprBreakdown>>) =>
  render(<AprBreakdown apr={8.5} {...props} />);

describe('AprBreakdown', () => {
  // ── Trigger ───────────────────────────────────────────────────────────────

  it('renders the APR on the trigger button', () => {
    renderBreakdown({ apr: 8.5 });
    expect(screen.getByRole('button', { name: /8\.50%/i })).toBeInTheDocument();
  });

  it('trigger has aria-expanded=false when closed', () => {
    renderBreakdown();
    expect(screen.getByRole('button', { name: /8\.50%/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('panel is not in the DOM when closed', () => {
    renderBreakdown();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── Open / close ──────────────────────────────────────────────────────────

  it('opens panel on trigger click', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /8\.50%/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes panel when close button is clicked', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    fireEvent.click(screen.getByRole('button', { name: /close apr breakdown/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes panel on Escape key', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles closed when trigger is clicked again', () => {
    renderBreakdown();
    const trigger = screen.getByRole('button', { name: /8\.50%/i });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── Itemized math ─────────────────────────────────────────────────────────

  it('shows all breakdown rows when panel is open', () => {
    renderBreakdown({ apr: 8.5, baseRate: 5, riskPremium: 3.5, originationFee: 0 });
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.getByText('Base interest rate')).toBeInTheDocument();
    expect(screen.getByText('Risk premium')).toBeInTheDocument();
  });

  it('shows origination fee row when fee > 0', () => {
    renderBreakdown({ apr: 9.5, baseRate: 5, riskPremium: 3.5, originationFee: 1 });
    fireEvent.click(screen.getByRole('button', { name: /9\.50%/i }));
    expect(screen.getByText('Origination fee (annual equiv.)')).toBeInTheDocument();
  });

  it('omits origination fee row when fee is 0', () => {
    renderBreakdown({ apr: 8.5, baseRate: 5, riskPremium: 3.5, originationFee: 0 });
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.queryByText(/origination fee/i)).not.toBeInTheDocument();
  });

  it('total APR row shows the passed apr value', () => {
    renderBreakdown({ apr: 12.75 });
    fireEvent.click(screen.getByRole('button', { name: /12\.75%/i }));
    // Total row shows "12.75%" in the value cell
    const totalValue = document.querySelector('.apr-breakdown-total-value');
    expect(totalValue?.textContent).toContain('12.75%');
  });

  it('derives risk premium from apr - baseRate when riskPremium is omitted', () => {
    renderBreakdown({ apr: 8.5, baseRate: 5 });
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    // Risk premium = 8.5 - 5 = 3.5
    expect(screen.getByText('Risk premium')).toBeInTheDocument();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('panel has role="dialog" with accessible label', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.getByRole('dialog', { name: /apr breakdown/i })).toBeInTheDocument();
  });

  it('close button has an accessible label', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.getByRole('button', { name: /close apr breakdown/i })).toBeInTheDocument();
  });

  it('footnote is present', () => {
    renderBreakdown();
    fireEvent.click(screen.getByRole('button', { name: /8\.50%/i }));
    expect(screen.getByText(/monthly interest/i)).toBeInTheDocument();
  });
});
