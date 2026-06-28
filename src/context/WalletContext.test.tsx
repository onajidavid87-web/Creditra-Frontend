/**
 * WalletContext — auto-reconnect tests
 *
 * Cover:
 *  1. No stored wallet → status stays 'disconnected', no reconnect attempt.
 *  2. Stored wallet found → status transitions to 'reconnecting' on mount.
 *  3. Reconnect succeeds within timeout → status becomes 'connected',
 *     reconnectTimedOut stays false.
 *  4. Reconnect times out → reconnectTimedOut becomes true while still
 *     'reconnecting'.
 *  5. Reconnect succeeds after timeout → reconnectTimedOut resets to false,
 *     status becomes 'connected'.
 *  6. Reconnect fails → status becomes 'error', reconnectTimedOut resets.
 *  7. dismissReconnectBanner → sets reconnectTimedOut to false without
 *     changing status.
 *  8. retryReconnect → re-runs the reconnect flow (status back to
 *     'reconnecting', fresh timeout window).
 *  9. retryReconnect is a no-op when no stored wallet preference exists.
 * 10. disconnect → clears wallet, sets status to 'disconnected', resets
 *     reconnectTimedOut.
 * 11. User-initiated connect() → uses 'connecting' (not 'reconnecting')
 *     and does not trip the timeout banner.
 * 12. Timeout timer is cleared on unmount (no state-update-on-unmount warning).
 */

import {
  render,
  screen,
  act,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalletProvider, useWallet } from './WalletContext';
import * as walletUtils from '../utils/wallet';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORED_WALLET = {
  type: 'freighter' as const,
  publicKey: 'GABC123...',
  network: 'PUBLIC',
};

/**
 * Test consumer that renders all relevant context values as data-testid
 * attributes so tests can assert on them without reaching into state.
 */
function WalletContextConsumer() {
  const {
    status,
    wallet,
    error,
    reconnectTimedOut,
    dismissReconnectBanner,
    retryReconnect,
    disconnect,
    connect,
  } = useWallet();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="wallet">{wallet?.publicKey ?? 'null'}</span>
      <span data-testid="error">{error?.type ?? 'null'}</span>
      <span data-testid="reconnect-timed-out">{String(reconnectTimedOut)}</span>
      <button data-testid="dismiss-btn" onClick={dismissReconnectBanner}>
        Dismiss
      </button>
      <button data-testid="retry-btn" onClick={retryReconnect}>
        Retry
      </button>
      <button data-testid="disconnect-btn" onClick={disconnect}>
        Disconnect
      </button>
      <button
        data-testid="connect-btn"
        onClick={() => connect('freighter')}
      >
        Connect
      </button>
    </div>
  );
}

function renderProvider(timeoutMs = 200) {
  return render(
    <WalletProvider timeoutMs={timeoutMs}>
      <WalletContextConsumer />
    </WalletProvider>,
  );
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);
  vi.spyOn(walletUtils, 'connectWallet').mockResolvedValue(STORED_WALLET);
  vi.spyOn(walletUtils, 'saveWalletPreference').mockImplementation(() => {});
  vi.spyOn(walletUtils, 'disconnectWallet').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WalletContext — auto-reconnect', () => {
  // 1
  it('stays disconnected when no wallet is stored', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);
    renderProvider();
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByTestId('status').textContent).toBe('disconnected');
    expect(walletUtils.connectWallet).not.toHaveBeenCalled();
  });

  // 2
  it('transitions to "reconnecting" immediately when a stored wallet is found', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    // connectWallet never resolves in this test (pending promise)
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    renderProvider();
    // After the initial render (before any timers), status should be reconnecting
    await act(async () => {});
    expect(screen.getByTestId('status').textContent).toBe('reconnecting');
  });

  // 3
  it('transitions to "connected" when reconnect succeeds within the timeout', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    vi.spyOn(walletUtils, 'connectWallet').mockResolvedValue(STORED_WALLET);

    renderProvider(500); // 500 ms timeout
    await act(async () => {
      vi.advanceTimersByTime(10); // resolve immediately, well within timeout
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
    expect(screen.getByTestId('wallet').textContent).toBe(STORED_WALLET.publicKey);
  });

  // 4
  it('sets reconnectTimedOut=true when timeout fires before reconnect resolves', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    // Keep the connect pending
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    renderProvider(300); // 300 ms timeout
    await act(async () => {
      vi.advanceTimersByTime(301); // fire the timeout
    });

    expect(screen.getByTestId('status').textContent).toBe('reconnecting');
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('true');
  });

  // 5
  it('resets reconnectTimedOut to false when reconnect eventually succeeds', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);

    let resolveConnect!: (v: typeof STORED_WALLET) => void;
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(
      new Promise((res) => { resolveConnect = res; }),
    );

    renderProvider(200);

    // Fire the timeout
    await act(async () => { vi.advanceTimersByTime(201); });
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('true');

    // Now let the connect finish
    await act(async () => { resolveConnect(STORED_WALLET); });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('connected');
      expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
    });
  });

  // 6
  it('transitions to "error" and resets reconnectTimedOut when reconnect fails', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    vi.spyOn(walletUtils, 'connectWallet').mockRejectedValue({
      type: 'connection_failed',
      message: 'Extension unavailable',
    });

    renderProvider(500);
    await act(async () => { vi.runAllTimers(); });

    expect(screen.getByTestId('status').textContent).toBe('error');
    expect(screen.getByTestId('error').textContent).toBe('connection_failed');
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
  });

  // 7
  it('dismissReconnectBanner clears reconnectTimedOut without changing status', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    renderProvider(200);
    await act(async () => { vi.advanceTimersByTime(201); });
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('true');

    await act(async () => {
      screen.getByTestId('dismiss-btn').click();
    });

    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
    // Status unchanged — reconnect still in flight
    expect(screen.getByTestId('status').textContent).toBe('reconnecting');
  });

  // 8
  it('retryReconnect re-runs reconnect with a fresh timeout window', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);

    let callCount = 0;
    vi.spyOn(walletUtils, 'connectWallet').mockImplementation(
      () => new Promise((_, reject) => {
        callCount++;
        // First call → reject immediately; second call → stay pending
        if (callCount === 1) reject({ type: 'connection_failed', message: 'fail' });
      }),
    );

    renderProvider(200);

    // Wait for first reconnect to fail
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByTestId('status').textContent).toBe('error');

    // Now let the second call stay pending
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    await act(async () => {
      screen.getByTestId('retry-btn').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('reconnecting');
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
  });

  // 9
  it('retryReconnect is a no-op when no stored wallet exists', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);

    renderProvider();
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByTestId('status').textContent).toBe('disconnected');

    await act(async () => {
      screen.getByTestId('retry-btn').click();
    });

    expect(walletUtils.connectWallet).not.toHaveBeenCalled();
    expect(screen.getByTestId('status').textContent).toBe('disconnected');
  });

  // 10
  it('disconnect clears wallet, resets status and reconnectTimedOut', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    renderProvider(200);
    await act(async () => { vi.advanceTimersByTime(201); });
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('true');

    await act(async () => {
      screen.getByTestId('disconnect-btn').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('disconnected');
    expect(screen.getByTestId('wallet').textContent).toBe('null');
    expect(screen.getByTestId('reconnect-timed-out').textContent).toBe('false');
    expect(walletUtils.disconnectWallet).toHaveBeenCalled();
  });

  // 11
  it('user-initiated connect() uses "connecting" state, not "reconnecting"', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(null);
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    renderProvider(200);
    await act(async () => {
      screen.getByTestId('connect-btn').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('connecting');
  });

  // 12
  it('cleans up timeout timer on unmount (no setState-on-unmounted warning)', async () => {
    vi.spyOn(walletUtils, 'getStoredWallet').mockReturnValue(STORED_WALLET);
    vi.spyOn(walletUtils, 'connectWallet').mockReturnValue(new Promise(() => {}));

    const consoleSpy = vi.spyOn(console, 'error');

    const { unmount } = renderProvider(200);
    await act(async () => {
      // Unmount before the timeout fires
      unmount();
      vi.advanceTimersByTime(500); // fire timers post-unmount
    });

    // React's "Can't perform a React state update on an unmounted component"
    // warning (pre-18 wording) must not appear.
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('unmounted'),
    );
  });
});
