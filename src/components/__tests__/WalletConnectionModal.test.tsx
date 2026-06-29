import React, { useRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WalletConnectionModal, WalletProvider } from '../WalletConnectionModal';
import type { WalletType } from '@/utils/wallet';
import * as walletUtils from '@/utils/wallet';

// Mock hooks to avoid DOM side effects in test environment
vi.mock('@/hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@/hooks/useInertBackdrop', () => ({
  useInertBackdrop: vi.fn(),
}));

// Test wrapper with trigger ref
const TestWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConnect: (
    provider: WalletProvider,
    options?: { remember?: boolean },
  ) => Promise<void>;
  detectedWallets?: WalletProvider[];
}> = ({ isOpen, onClose, onConnect, detectedWallets }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <MemoryRouter>
      <div>
        <button ref={triggerRef} data-testid="trigger-button">
          Open Wallet Modal
        </button>
        <WalletConnectionModal
          isOpen={isOpen}
          onClose={onClose}
          onConnect={onConnect}
          triggerRef={triggerRef}
          detectedWallets={detectedWallets}
        />
      </div>
    </MemoryRouter>
  );
};

describe('WalletConnectionModal Accessibility', () => {
  const mockOnClose = vi.fn();
  const mockOnConnect = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // WCAG 4.1.2: Name, Role, Value
  it('has correct ARIA attributes', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter']}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  // WCAG 2.1.2: No Keyboard Trap
  it('traps focus within the modal', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter', 'albedo']}
      />
    );

    const closeButton = screen.getByLabelText('Close wallet connection dialog');
    const rememberCheckbox = screen.getByTestId('wallet-remember-checkbox');
    const freighterButton = screen.getByLabelText('Connect with Freighter');
    const albedoButton = screen.getByLabelText('Connect with Albedo');
    const xbullButton = screen.getByLabelText('Install xBull wallet');
    const rabetButton = screen.getByLabelText('Install Rabet wallet');
    const learnLink = screen.getByRole('link', { name: /visit the wallet setup guide/i });

    // Focus should start on first focusable element
    await waitFor(() => {
      expect(document.activeElement).toBe(closeButton);
    });

    // Tab cycles forward through all focusable elements.  The
    // remember-my-choice checkbox is a new tab stop inserted before the
    // wallet list.
    await user.tab();
    expect(document.activeElement).toBe(rememberCheckbox);

    await user.tab();
    expect(document.activeElement).toBe(freighterButton);

    await user.tab();
    expect(document.activeElement).toBe(albedoButton);

    await user.tab();
    expect(document.activeElement).toBe(xbullButton);

    await user.tab();
    expect(document.activeElement).toBe(rabetButton);

    await user.tab();
    expect(document.activeElement).toBe(learnLink);

    // Tab from last element cycles back to first
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
  });

  // WCAG 2.1.2: No Keyboard Trap (Shift+Tab)
  it('cycles focus backwards with Shift+Tab', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter']}
      />
    );

    const closeButton = screen.getByLabelText('Close wallet connection dialog');
    const learnLink = screen.getByRole('link', { name: /visit the wallet setup guide/i });

    // Focus close button
    closeButton.focus();

    // Shift+Tab from first element wraps to last (Learn about wallets link)
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(learnLink);

    // The forward-tab test covers the full order; this assertion focuses on
    // the backwards wrap behavior from the first item to the last.
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
  });

  // Escape key closes modal
  it('closes on Escape key press', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Return focus to trigger on close
  it('returns focus to trigger button when closed', async () => {
    const { rerender } = render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    // Close the modal
    rerender(
      <TestWrapper
        isOpen={false}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    const triggerButton = screen.getByTestId('trigger-button');
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton);
    });
  });

  // Click backdrop closes modal
  it('closes when clicking backdrop', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    const backdrop = document.querySelector('.wallet-modal-backdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  // WCAG 1.4.1: Use of Color - detected wallets have visual + text indicator
  it('shows detected wallets with text indicator, not just color', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter']}
      />
    );

    const freighterButton = screen.getByLabelText('Connect with Freighter');
    expect(freighterButton).toHaveClass('wallet-option--detected');

    // Should have text "Detected" visible
    expect(screen.getByText('Detected')).toBeVisible();

    // Should have status dot (visual) + text (non-color)
    const statusDot = freighterButton.querySelector('.status-dot');
    expect(statusDot).toBeInTheDocument();
  });

  it('shows undetected wallets with install text, not just color', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={[]}
      />
    );

    const albedoButton = screen.getByLabelText('Install Albedo wallet');
    expect(albedoButton).toHaveClass('wallet-option--undetected');

    // Should have text "Install to connect" (multiple wallets show this, check at least one)
    const installLabels = screen.getAllByText('Install to connect');
    expect(installLabels.length).toBeGreaterThan(0);
    expect(installLabels[0]).toBeVisible();

    // Should have icon indicator (not just color)
    const statusIcon = albedoButton.querySelector('.status-icon');
    expect(statusIcon).toBeInTheDocument();
  });

  // WCAG 2.5.5: Target Size (44px minimum)
  it('wallet options have minimum 44px tap target', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter']}
      />
    );

    const freighterButton = screen.getByLabelText('Connect with Freighter');
    // Inline style is used so jsdom can read it (CSS files aren't processed in jsdom)
    expect(parseInt(freighterButton.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(freighterButton.style.minWidth, 10)).toBeGreaterThanOrEqual(44);
  });

  it('links to the Help Center wallet section with internal navigation', () => {
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    expect(
      screen.getByRole('link', { name: /visit the wallet setup guide/i })
    ).toHaveAttribute('href', '/help#wallet');
  });

  // Wallet connection flow
  it('calls onConnect when clicking a detected wallet', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={['freighter']}
      />
    );

    const freighterButton = screen.getByLabelText('Connect with Freighter');
    await user.click(freighterButton);

    await waitFor(() => {
      expect(mockOnConnect).toHaveBeenCalledWith('freighter', { remember: false });
    });
  });

  // ── MRU ordering ────────────────────────────────────────────────────────

  describe('MRU ordering', () => {
    // `vi.clearAllMocks()` (the outer beforeEach) clears call data but does
    // NOT reset spy implementations, so spies from a previous test leak in.
    // We always stub both MRU sources at the top of each test to fully isolate
    // them.
    function isolate({
      recent,
      legacy,
    }: {
      recent: WalletType[];
      legacy: ReturnType<typeof walletUtils.getStoredWallet>;
    }) {
      vi.spyOn(walletUtils, 'getRecentWalletOrder').mockReturnValue(recent);
      vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(legacy);
    }

    beforeEach(() => {
      window.localStorage.clear();
    });

    it('puts the most-recent wallet first when persisted MRU exists', () => {
      // Seed MRU: xbull is the most recently used, then albedo.
      isolate({ recent: ['xbull', 'albedo'], legacy: null });

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      // With MRU data, the modal collapses the full list behind a "Switch
      // wallet" link and surfaces the most-recent wallet as a one-click
      // "Continue with" affordance.  Assert against that affordance instead
      // of the list (which is hidden).
      const continueBtn = screen.getByTestId('wallet-continue-btn');
      expect(continueBtn).toHaveAttribute('aria-label', 'Continue with xBull (last used)');
    });

    it('falls back to legacy wallet_info when MRU is empty', () => {
      isolate({
        recent: [],
        legacy: {
          type: 'xbull',
          publicKey: 'G-XBULL',
          network: 'PUBLIC',
        },
      });

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      const continueBtn = screen.getByTestId('wallet-continue-btn');
      expect(continueBtn).toHaveAttribute('aria-label', 'Continue with xBull (last used)');
    });

    it('drops entries for unsupported wallet types silently', () => {
      // Simulate a stored MRU containing a no-longer-supported wallet and
      // a real one.  Only the real one should make the ordering.
      isolate({ recent: ['rabet', 'freighter'], legacy: null });

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      const continueBtn = screen.getByTestId('wallet-continue-btn');
      expect(continueBtn).toHaveAttribute('aria-label', 'Continue with Rabet (last used)');
    });

    it('keeps the full wallet catalogue visible when no MRU exists', () => {
      isolate({ recent: [], legacy: null });

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      // Continue-with affordance should NOT appear without recency data.
      expect(screen.queryByTestId('wallet-continue-btn')).not.toBeInTheDocument();
      // Wallet list should be visible.
      expect(screen.getByTestId('wallet-modal-list')).not.toHaveAttribute('hidden');
    });
  });

  // ── Opt-in checkbox ──────────────────────────────────────────────────────

  describe('Remember-my-choice checkbox', () => {
    // The checkbox is opt-in. Ensure spy state from prior tests doesn't leak.
    function isolateToNone() {
      vi.spyOn(walletUtils, 'getRecentWalletOrder').mockReturnValue([]);
      vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);
    }

    beforeEach(() => {
      window.localStorage.clear();
    });

    it('defaults to unchecked so the feature is opt-in', () => {
      isolateToNone();
      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      const checkbox = screen.getByTestId('wallet-remember-checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('is associated with a label and a help description', () => {
      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />,
      );

      const checkbox = screen.getByTestId('wallet-remember-checkbox');
      const help = screen.getByText(
        /next visit.*clear this any time/i,
      );
      // The checkbox has aria-describedby pointing at the help paragraph.
      expect(checkbox).toHaveAttribute('aria-describedby');
      const describedById = checkbox.getAttribute('aria-describedby')!;
      expect(describedById).toBeTruthy();
      // Either help is exactly the described element, or matches by content.
      const helpById = document.getElementById(describedById);
      expect(helpById === null ? help : helpById).toBeTruthy();
    });

    it('forwards remember=false to onConnect when the box stays unchecked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter']}
        />,
      );

      await user.click(screen.getByLabelText('Connect with Freighter'));
      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenLastCalledWith('freighter', { remember: false });
      });
    });

    it('forwards remember=true to onConnect when the box is checked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter']}
        />,
      );

      await user.click(screen.getByTestId('wallet-remember-checkbox'));
      expect(screen.getByTestId('wallet-remember-checkbox')).toBeChecked();

      await user.click(screen.getByLabelText('Connect with Freighter'));
      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenLastCalledWith('freighter', { remember: true });
      });
    });

    it('resets to unchecked when the modal re-opens', async () => {
      const { rerender } = render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter']}
        />,
      );

      await userEvent.setup().click(screen.getByTestId('wallet-remember-checkbox'));
      expect(screen.getByTestId('wallet-remember-checkbox')).toBeChecked();

      rerender(
        <TestWrapper
          isOpen={false}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter']}
        />,
      );

      rerender(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter']}
        />,
      );
      expect(screen.getByTestId('wallet-remember-checkbox')).not.toBeChecked();
    });
  });

  // ── Continue-with + Switch-wallet affordance ─────────────────────────────

  describe('Continue-with primary wallet affordance', () => {
    function isolate(recent: WalletType[]) {
      vi.spyOn(walletUtils, 'getRecentWalletOrder').mockReturnValue(recent);
      vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);
    }

    beforeEach(() => {
      window.localStorage.clear();
    });

    it('renders Continue with… when a primary wallet exists from MRU', () => {
      isolate(['albedo']);

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['freighter', 'albedo']}
        />,
      );

      const cont = screen.getByTestId('wallet-continue-btn');
      expect(cont).toHaveAttribute('aria-label', 'Continue with Albedo (last used)');
      // The full list is collapsed by default.
      expect(screen.getByTestId('wallet-modal-list')).toHaveAttribute('hidden');
    });

    it('clicking Continue invokes onConnect with remember option', async () => {
      const user = userEvent.setup();
      isolate(['albedo']);

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['albedo']}
        />,
      );

      await user.click(screen.getByTestId('wallet-continue-btn'));
      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenLastCalledWith('albedo', { remember: false });
      });
    });

    it('Switch wallet reveal shows the full list and updates aria-expanded', async () => {
      const user = userEvent.setup();
      isolate(['albedo']);

      render(
        <TestWrapper
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          detectedWallets={['albedo', 'freighter']}
        />,
      );

      const switchBtn = screen.getByRole('button', { name: /switch wallet/i });
      expect(switchBtn).toHaveAttribute('aria-expanded', 'false');

      await user.click(switchBtn);

      expect(screen.getByTestId('wallet-modal-list')).not.toHaveAttribute('hidden');
      // The "Hide full list" affordance now exists with aria-expanded=true.
      const hideBtn = screen.getByRole('button', { name: /hide full list/i });
      expect(hideBtn).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // Install link for undetected wallets
  it('opens install page for undetected wallets', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
        detectedWallets={[]}
      />
    );

    const xbullButton = screen.getByLabelText('Install xBull wallet');
    await user.click(xbullButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://xbull.app',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockRestore();
  });

  // Error handling
  it('displays error when connection fails', async () => {
    const failingConnect = vi.fn().mockRejectedValue(new Error('Connection refused'));

    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={failingConnect}
        detectedWallets={['freighter']}
      />
    );

    const freighterButton = screen.getByLabelText('Connect with Freighter');
    fireEvent.click(freighterButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connection refused');
    });
  });

  // Loading state
  it('shows loading state while connecting', async () => {
    const slowConnect = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <TestWrapper
        isOpen={true}
        onClose={mockOnClose}
        onConnect={slowConnect}
        detectedWallets={['freighter']}
      />
    );

    const freighterButton = screen.getByLabelText('Connect with Freighter');
    fireEvent.click(freighterButton);

    // Should show spinner
    await waitFor(() => {
      expect(freighterButton.querySelector('.wallet-option-spinner')).toBeInTheDocument();
    });

    // Should be disabled
    expect(freighterButton).toBeDisabled();
  });

  // Does not render when closed
  it('does not render when isOpen is false', () => {
    render(
      <TestWrapper
        isOpen={false}
        onClose={mockOnClose}
        onConnect={mockOnConnect}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
