import React, { useRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RepayModal } from '../RepayModal';

// Suppress DOM side-effects from companion hooks
vi.mock('@/hooks/useBodyScrollLock', () => ({ useBodyScrollLock: vi.fn() }));
vi.mock('@/hooks/useInertBackdrop', () => ({ useInertBackdrop: vi.fn() }));

// Suppress InlineHelpOverlay (renders HelpCenter which is heavy and unrelated)
vi.mock('../InlineHelpOverlay', () => ({
  InlineHelpOverlay: () => null,
}));

const defaultCreditLine = {
  id: 'CL-001',
  name: 'Primary Credit Line',
  limit: 10_000,
  utilized: 3_000,
  apr: 12,
};

function TestWrapper({
  onClose = vi.fn(),
  onSuccess = vi.fn(),
}: {
  onClose?: () => void;
  onSuccess?: (amount: number) => void;
}) {
  const repayTriggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={repayTriggerRef} data-testid="repay-trigger">
        Repay
      </button>
      <RepayModal
        creditLine={defaultCreditLine}
        walletBalance={5_000}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </>
  );
}

describe('RepayModal – focus trap (A11Y-002)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a dialog with the correct ARIA attributes', () => {
    render(<TestWrapper />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'repay-modal-title');
  });

  // A11Y-002: useFocusTrap called with { isActive } object form, not a plain boolean.
  // The trap must move focus into the modal on mount.
  it('activates focus trap and moves focus into the modal', () => {
    vi.useFakeTimers();
    render(<TestWrapper />);

    // Flush the 50 ms defer inside useFocusTrap
    act(() => {
      vi.runAllTimers();
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    vi.useRealTimers();
  });

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<TestWrapper onClose={onClose} />);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Regression: focus must return to the "Repay" trigger button on close.
  // Uses a wrapper that owns the trigger ref and passes it via triggerRef.
  it('returns focus to the triggering Repay button on close', async () => {
    function WithTriggerRef() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = React.useState(true);

      return (
        <>
          <button ref={triggerRef} data-testid="repay-trigger" onClick={() => setOpen(true)}>
            Repay
          </button>
          {open && (
            <RepayModal
              creditLine={defaultCreditLine}
              walletBalance={5_000}
              onClose={() => setOpen(false)}
              onSuccess={vi.fn()}
              triggerRef={triggerRef}
            />
          )}
        </>
      );
    }

    render(<WithTriggerRef />);

    // Close via Escape; useFocusTrap cleanup returns focus to triggerRef
    await userEvent.keyboard('{Escape}');

    expect(document.activeElement).toBe(screen.getByTestId('repay-trigger'));
  });
});
