import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletButton } from './WalletButton';
import { useWallet } from '../context/WalletContext';

// Mock the WalletContext
vi.mock('../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

describe('WalletButton Component', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockSetDropdownOpen = vi.fn();
  const mockForgetRememberedChoice = vi.fn();

  /**
   * Common mock factory.  Includes the new context fields added by the
   * Remember-Choice feature so the component never sees `undefined`.
   */
  const mockWallet = (overrides: Record<string, unknown> = {}) => ({
    wallet: null,
    status: 'disconnected' as const,
    connect: mockConnect,
    disconnect: mockDisconnect,
    setDropdownOpen: mockSetDropdownOpen,
    forgetRememberedChoice: mockForgetRememberedChoice,
    isRemembered: false,
    hasNetworkMismatch: false,
    switchNetwork: vi.fn(),
    balances: null,
    lastUpdated: null,
    refreshBalance: vi.fn(),
    clearError: vi.fn(),
    dismissReconnectBanner: vi.fn(),
    retryReconnect: vi.fn(),
    reconnectTimedOut: false,
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Connect Wallet button when disconnected', () => {
    (useWallet as any).mockReturnValue(mockWallet());

    render(<WalletButton />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('renders wallet address chip when connected', () => {
    (useWallet as any).mockReturnValue(
      mockWallet({
        wallet: {
          publicKey: 'GD6W5Z37V5XF3HPH...',
          type: 'freighter',
          network: 'PUBLIC',
        },
        status: 'connected',
      }),
    );

    render(<WalletButton />);
    const button = screen.getByRole('button', { name: /wallet connected: gd6w\.\.\.h\.\.\./i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles dropdown and resets QR state on close', () => {
    (useWallet as any).mockReturnValue(
      mockWallet({
        wallet: {
          publicKey: 'GD6W5Z37V5XF3HPH...',
          type: 'freighter',
          network: 'PUBLIC',
        },
        status: 'connected',
      }),
    );

    render(<WalletButton />);
    const trigger = screen.getByRole('button', { name: /wallet connected/i });

    // Open dropdown
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const showQrBtn = screen.getByRole('menuitem', { name: /show qr code/i });
    expect(showQrBtn).toBeInTheDocument();
    expect(showQrBtn).toHaveAttribute('aria-expanded', 'false');

    // Click Show QR Code
    fireEvent.click(showQrBtn);
    expect(showQrBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('wallet-qr-wrapper')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Reopen dropdown - QR should be reset to hidden
    fireEvent.click(trigger);
    const showQrBtnReopened = screen.getByRole('menuitem', { name: /show qr code/i });
    expect(showQrBtnReopened).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('wallet-qr-wrapper')).not.toBeInTheDocument();
  });

  it('performs disconnect action and resets state', () => {
    (useWallet as any).mockReturnValue(
      mockWallet({
        wallet: {
          publicKey: 'GD6W5Z37V5XF3HPH...',
          type: 'freighter',
          network: 'PUBLIC',
        },
        status: 'connected',
      }),
    );

    render(<WalletButton />);
    const trigger = screen.getByRole('button', { name: /wallet connected/i });

    // Open dropdown and toggle QR code
    fireEvent.click(trigger);
    const showQrBtn = screen.getByRole('menuitem', { name: /show qr code/i });
    fireEvent.click(showQrBtn);

    // Click disconnect
    const disconnectBtn = screen.getByRole('menuitem', { name: /disconnect/i });
    fireEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // New: Forget affordance becomes visible when isRemembered=true.
  it('shows Forget remembered choice in dropdown when isRemembered=true', () => {
    (useWallet as any).mockReturnValue(
      mockWallet({
        wallet: {
          publicKey: 'GD6W5Z37V5XF3HPH...',
          type: 'freighter',
          network: 'PUBLIC',
        },
        status: 'connected',
        isRemembered: true,
      }),
    );

    render(<WalletButton />);
    fireEvent.click(screen.getByRole('button', { name: /wallet connected/i }));
    expect(
      screen.getByRole('menuitem', { name: /forget remembered wallet choice/i }),
    ).toBeInTheDocument();
  });

  // New: Forget affordance is hidden when isRemembered=false (default).
  it('hides Forget remembered choice when isRemembered=false', () => {
    (useWallet as any).mockReturnValue(
      mockWallet({
        wallet: {
          publicKey: 'GD6W5Z37V5XF3HPH...',
          type: 'freighter',
          network: 'PUBLIC',
        },
        status: 'connected',
        // isRemembered explicitly false (default in mockWallet)
      }),
    );

    render(<WalletButton />);
    fireEvent.click(screen.getByRole('button', { name: /wallet connected/i }));
    expect(
      screen.queryByRole('menuitem', { name: /forget remembered wallet choice/i }),
    ).not.toBeInTheDocument();
  });
});
