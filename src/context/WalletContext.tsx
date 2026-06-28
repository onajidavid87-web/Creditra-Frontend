/**
 * WalletContext
 *
 * App-wide wallet state provider.
 *
 * Auto-reconnect on load
 * ─────────────────────────────────────────────────────────────────────────────
 * When a `wallet_info` entry is found in `localStorage`, the provider
 * immediately kicks off a reconnect attempt instead of blindly restoring the
 * stored object.  This confirms the extension is still present and accessible
 * before marking the wallet as "connected".
 *
 * Timeout banner
 * ─────────────────────────────────────────────────────────────────────────────
 * If the reconnect attempt has not resolved within `RECONNECT_TIMEOUT_MS`
 * (default 8 000 ms), `reconnectTimedOut` is set to `true`.  The
 * `WalletReconnectBanner` component observes this flag and shows a
 * non-blocking, dismissible banner with a manual retry action.
 *
 * The banner is intentionally non-blocking: the rest of the UI remains
 * fully interactive while reconnect is in flight.  Once the reconnect
 * succeeds (or the user dismisses the banner), the flag resets.
 *
 * Lifecycle
 * ─────────────────────────────────────────────────────────────────────────────
 *   disconnected  — no stored wallet, no attempt in progress
 *   reconnecting  — auto-reconnect attempt running on load
 *   connecting    — user-initiated connection via WalletConnectionModal
 *   connected     — wallet live and public key confirmed
 *   error         — last connection attempt failed; `error` is populated
 *
 * Exported API changes (new surface area)
 * ─────────────────────────────────────────────────────────────────────────────
 *   reconnectTimedOut: boolean
 *     True when the in-progress auto-reconnect has exceeded RECONNECT_TIMEOUT_MS.
 *     Resets to false when reconnect succeeds, fails, or is dismissed.
 *
 *   dismissReconnectBanner(): void
 *     Clears the timeout banner without aborting the underlying reconnect.
 *     Useful when the user acknowledges the delay and wants to continue browsing.
 *
 *   retryReconnect(): void
 *     Re-runs the auto-reconnect flow using the stored wallet preference.
 *     No-op if no preference is stored.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { WalletInfo, ConnectionStatus, WalletError, WalletType } from '../types/wallet';
import {
  connectWallet,
  disconnectWallet,
  saveWalletPreference,
  getStoredWallet,
} from '../utils/wallet';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * How long (ms) to wait for a reconnect attempt before showing the
 * "taking too long" banner.  8 s covers most slow-loading extensions
 * without feeling laggy on fast connections (typical connect < 1 s).
 *
 * Exposed so tests can override it without patching timers globally.
 */
export const RECONNECT_TIMEOUT_MS = 8_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BalanceInfo {
  asset: string; // e.g., 'XLM' or asset_code
  balance: string;
}

interface WalletContextType {
  /** The currently connected wallet, or `null` when disconnected. */
  wallet: WalletInfo | null;
  /** Coarse connection-lifecycle state. UI consumers branch on this for spinners and badges. */
  status: ConnectionStatus;
  /**
   * Discriminated wallet-error union, populated only when `status === 'error'`.
   * Branch on `error.type` to render specific recovery copy.
   */
  error: WalletError | null;
  /**
   * `true` when an auto-reconnect is in flight and has exceeded
   * `RECONNECT_TIMEOUT_MS`.  The `WalletReconnectBanner` subscribes to
   * this to show the "taking longer than expected" affordance.
   */
  reconnectTimedOut: boolean;
  /**
   * Open a connection to the given wallet. Updates `status` to
   * `connecting`, then either `connected` (on success) or `error`.
   * Successful connections are persisted to `localStorage` so the same
   * wallet is rehydrated on next visit.
   */
  connect: (type: WalletType) => Promise<void>;
  /** Forget the current wallet, clear preference, return to disconnected state. */
  disconnect: () => void;
  /** Clear an error without changing status — used by retry affordances. */
  clearError: () => void;
  /**
   * Dismiss the reconnect-timeout banner without aborting the in-flight
   * reconnect.  The banner will not reappear until the next page load.
   */
  dismissReconnectBanner: () => void;
  /**
   * Re-run the auto-reconnect using the stored wallet type.  No-op when
   * no stored preference exists.  Resets `reconnectTimedOut` and starts
   * a fresh timeout window.
   */
  retryReconnect: () => void;
  refreshBalance: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  balances: BalanceInfo[] | null;
  lastUpdated: Date | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * App-wide wallet provider.
 *
 * Mount this once, near the top of the tree (see `src/App.tsx`), above any
 * component that calls `useWallet()`.
 *
 * @param timeoutMs - Override the reconnect timeout (used in tests).
 */
export const WalletProvider = ({
  children,
  timeoutMs = RECONNECT_TIMEOUT_MS,
}: {
  children: ReactNode;
  /** Override the reconnect timeout duration (ms). Defaults to RECONNECT_TIMEOUT_MS. */
  timeoutMs?: number;
}) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<WalletError | null>(null);
  const [reconnectTimedOut, setReconnectTimedOut] = useState(false);

  // Ref so the timeout cleanup in `runReconnect` closes over a stable reference.
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clear any pending reconnect timeout timer.
   * Safe to call even when no timer is active.
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Core reconnect logic.
   *
   * 1. Sets `status` to `'reconnecting'`.
   * 2. Starts a `timeoutMs` timer; if it fires before the connect resolves,
   *    `reconnectTimedOut` becomes `true` (banner appears).
   * 3. Calls `connectWallet(type)` which talks to the browser extension.
   * 4. On success → `connected`, clears timer.
   * 5. On failure → `error`, clears timer.
   *
   * The function is intentionally not exported; callers use `retryReconnect`.
   */
  const runReconnect = useCallback(
    async (type: WalletType) => {
      clearReconnectTimeout();
      setStatus('reconnecting');
      setError(null);
      setReconnectTimedOut(false);

      // Start the "taking too long" timer.
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectTimedOut(true);
      }, timeoutMs);

      try {
        const walletInfo = await connectWallet(type);
        clearReconnectTimeout();
        setWallet(walletInfo);
        setStatus('connected');
        setReconnectTimedOut(false);
        saveWalletPreference(walletInfo);
      } catch (err) {
        clearReconnectTimeout();
        setReconnectTimedOut(false);
        setError(err as WalletError);
        setStatus('error');
        setWallet(null);
      }
    },
    [clearReconnectTimeout, timeoutMs],
  );

  // ── Auto-reconnect on mount ─────────────────────────────────────────────────

  useEffect(() => {
    const stored = getStoredWallet();
    if (!stored) return; // No prior session — nothing to reconnect.

    runReconnect(stored.type);

    // Cleanup: if the component unmounts mid-reconnect, clear the timeout
    // so we don't update state on an unmounted provider.
    return () => clearReconnectTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run exactly once on mount.

  // ── User-initiated connection ───────────────────────────────────────────────

  const connect = async (type: WalletType) => {
    clearReconnectTimeout();
    setStatus('connecting');
    setError(null);
    setReconnectTimedOut(false);

    try {
      const walletInfo = await connectWallet(type);
      setWallet(walletInfo);
      setStatus('connected');
      saveWalletPreference(walletInfo);
    } catch (err) {
      setError(err as WalletError);
      setStatus('error');
      setWallet(null);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────

  const disconnect = () => {
    clearReconnectTimeout();
    disconnectWallet();
    setWallet(null);
    setStatus('disconnected');
    setError(null);
    setReconnectTimedOut(false);
  };

  // ── Banner controls ────────────────────────────────────────────────────────

  const dismissReconnectBanner = useCallback(() => {
    setReconnectTimedOut(false);
  }, []);

  const retryReconnect = useCallback(() => {
    const stored = getStoredWallet();
    if (!stored) return;
    runReconnect(stored.type);
  }, [runReconnect]);

  // ── Misc ───────────────────────────────────────────────────────────────────

  const clearError = () => setError(null);

  const [balances, setBalances] = useState<BalanceInfo[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalances = async () => {
    if (!wallet?.publicKey) return;
    try {
      const networkUrl =
        wallet.network === 'public'
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org';
      const response = await fetch(`${networkUrl}/accounts/${wallet.publicKey}`);
      const data = await response.json();
      const bal: BalanceInfo[] = data.balances.map((b: { asset_type: string; asset_code: string; balance: string }) => ({
        asset: b.asset_type === 'native' ? 'XLM' : b.asset_code,
        balance: b.balance,
      }));
      setBalances(bal);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch balances', e);
      setBalances(null);
    }
  };

  const refreshBalance = async () => {
    await fetchBalances();
  };

  const setDropdownOpen = (open: boolean) => {
    if (open) {
      fetchBalances();
      pollInterval.current = setInterval(fetchBalances, 30_000);
    } else if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  // Clean up polling interval on unmount.
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        status,
        error,
        reconnectTimedOut,
        connect,
        disconnect,
        clearError,
        dismissReconnectBanner,
        retryReconnect,
        balances,
        lastUpdated,
        refreshBalance,
        setDropdownOpen,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Read the wallet context inside a `WalletProvider` subtree.
 *
 * Throws if called outside the provider — this is intentional, since a
 * silent `undefined` would cascade into confusing downstream errors
 * (e.g. "cannot read property 'wallet' of undefined") far from the
 * actual misuse.
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
