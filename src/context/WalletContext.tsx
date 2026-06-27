import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletInfo, ConnectionStatus, WalletError, WalletType } from '../types/wallet';
import { connectWallet, disconnectWallet, saveWalletPreference, getStoredWallet } from '../utils/wallet';

const EXPECTED_NETWORK = 'PUBLIC';

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
  /** Whether the connected wallet is currently on the expected network. */
  hasNetworkMismatch: boolean;
  /** Request the wallet to switch to the expected network. */
  switchNetwork: () => Promise<void>;
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

  const switchNetwork = async () => {
    if (!wallet) return;

    try {
      if (wallet.type === 'freighter' && typeof window.freighter?.setNetwork === 'function') {
        await window.freighter.setNetwork('PUBLIC');
      } else if (wallet.type === 'albedo' && typeof window.albedo?.switchNetwork === 'function') {
        await window.albedo.switchNetwork({ network: 'PUBLIC' });
      } else if (wallet.type === 'xbull' && typeof window.xBullSDK?.switchNetwork === 'function') {
        await window.xBullSDK.switchNetwork('PUBLIC');
      } else if (wallet.type === 'rabet' && typeof window.rabet?.switchNetwork === 'function') {
        await window.rabet.switchNetwork('PUBLIC');
      }

      setWallet((currentWallet) => currentWallet ? { ...currentWallet, network: EXPECTED_NETWORK } : currentWallet);
      setHasNetworkMismatch(false);
    } catch {
      setError({ type: 'wrong_network', message: `Unable to switch ${wallet.type} to ${EXPECTED_NETWORK}.` } as WalletError);
      setHasNetworkMismatch(true);
    }
  };

  useEffect(() => {
    if (!wallet) {
      setHasNetworkMismatch(false);
      return;
    }

    setHasNetworkMismatch(wallet.network !== EXPECTED_NETWORK);
  }, [wallet]);

  return (
    <WalletContext.Provider value={{ wallet, status, error, connect, disconnect, clearError, hasNetworkMismatch, switchNetwork }}>
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
