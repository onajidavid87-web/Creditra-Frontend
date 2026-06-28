/**
 * Discriminator for the Stellar wallets we support in the UI.
 *
 * Each value must correspond to a branch in `src/utils/wallet.ts` and to
 * an option rendered by `WalletConnectionModal`.
 */
export type WalletType = 'freighter' | 'albedo' | 'xbull' | 'rabet';

export interface WalletInfo {
  type: WalletType;
  publicKey: string;
  network: string;
}

/**
 * Lifecycle states of the wallet connection, used by the WalletContext
 * reducer and surfaced to UI for spinners, retry buttons, and badges.
 */
/**
 * Lifecycle states of the wallet connection, used by the WalletContext
 * reducer and surfaced to UI for spinners, retry buttons, and badges.
 *
 * `reconnecting` — auto-reconnect on page load is in progress (no user
 *   interaction required; a non-blocking banner is shown if it takes
 *   longer than RECONNECT_TIMEOUT_MS).
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
  | 'connected'
  | 'error';

export interface WalletError {
  type: 'not_found' | 'connection_failed' | 'wrong_network' | 'user_rejected';
  message: string;
}
