import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { WalletInfo, ConnectionStatus, WalletError, WalletType } from '../types/wallet';
import { connectWallet, disconnectWallet, saveWalletPreference, getStoredWallet } from '../utils/wallet';

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
  refreshBalance: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * App-wide wallet provider.
 *
 * Rehydrates the previously-used wallet from `localStorage` on mount
 * (via `getStoredWallet()`), so a returning user is reconnected without
 * an extra interaction. All connection side effects are delegated to
 * `src/utils/wallet.ts`, which knows about each wallet's idiosyncratic
 * surface area (Freighter, Albedo, xBull, Rabet) and normalises them
 * into the canonical `WalletInfo` shape.
 *
 * Mount this once, near the top of the tree (see `src/App.tsx`).
 */
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<WalletError | null>(null);
  const [hasNetworkMismatch, setHasNetworkMismatch] = useState(false);

  useEffect(() => {
    const stored = getStoredWallet();
    if (stored) {
      setWallet(stored);
      setStatus('connected');
    }
  }, []);

  const connect = async (type: WalletType) => {
    setStatus('connecting');
    setError(null);

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

  const disconnect = () => {
    disconnectWallet();
    setWallet(null);
    setStatus('disconnected');
    setError(null);
  };

  const clearError = () => setError(null);

  const [balances, setBalances] = useState<BalanceInfo[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchBalances = async () => {
    if (!wallet?.publicKey) return;
    try {
      const networkUrl = wallet.network === 'public' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
      const response = await fetch(`${networkUrl}/accounts/${wallet.publicKey}`);
      const data = await response.json();
      const bal: BalanceInfo[] = data.balances.map((b: any) => ({
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
      // start polling
      fetchBalances();
      pollInterval.current = setInterval(fetchBalances, 30000);
    } else if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, status, error, connect, disconnect, clearError, balances, lastUpdated, refreshBalance, setDropdownOpen }}>
      {children}
    </WalletContext.Provider>
  );
};

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
