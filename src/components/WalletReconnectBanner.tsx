/**
 * WalletReconnectBanner
 *
 * A WCAG 2.1 AA–compliant, dismissible banner shown when the wallet
 * auto-reconnect attempt started on page load has not resolved within
 * the configured timeout (default 8 s).
 *
 * Visibility logic
 * ─────────────────────────────────────────────────────────────────────────────
 * - Visible when `status === 'reconnecting' && reconnectTimedOut === true`.
 * - Disappears automatically when `status` transitions to `'connected'`
 *   or `'error'` (the context resets `reconnectTimedOut`).
 * - Can be manually dismissed via the × button (`dismissReconnectBanner`).
 * - The "Retry" button calls `retryReconnect()`, restarting a fresh timeout.
 *
 * Accessibility
 * ─────────────────────────────────────────────────────────────────────────────
 * - `role="alert"` causes screen readers to announce the banner immediately
 *   when it appears without the user needing to navigate to it.
 * - `aria-live="assertive"` + `aria-atomic="true"` on the message ensures the
 *   full sentence is read on each status change.
 * - Dismiss and Retry buttons each have ≥44×44px touch targets (WCAG 2.5.5).
 * - Focus ring via `.focus-ring` utility (from `src/styles/focus.css`).
 * - Reduced-motion: spinner animation suppressed via CSS media query.
 *
 * Styling
 * ─────────────────────────────────────────────────────────────────────────────
 * All colours reference semantic tokens (`var(--warning)`, `var(--accent)`,
 * etc.) so the component adapts to `[data-contrast="high"]` automatically.
 * No hardcoded hex values appear in this file.
 *
 * Usage
 * ─────────────────────────────────────────────────────────────────────────────
 * Mount once just below the header, inside `<WalletProvider>`:
 *
 * ```tsx
 * <WalletProvider>
 *   <BrowserRouter>
 *     <WalletReconnectBanner />
 *     <Routes>…</Routes>
 *   </BrowserRouter>
 * </WalletProvider>
 * ```
 */

import { useWallet } from '../context/WalletContext';
import './WalletReconnectBanner.css';

// ─── Component ────────────────────────────────────────────────────────────────

export function WalletReconnectBanner() {
  const { status, reconnectTimedOut, dismissReconnectBanner, retryReconnect } = useWallet();

  /*
    Render conditions:
    1. Must be in 'reconnecting' state (auto-reconnect in flight).
    2. Must have exceeded the timeout threshold.

    Once reconnect succeeds or fails, WalletContext resets `reconnectTimedOut`
    to false, so this banner disappears without needing explicit lifecycle code
    here.
  */
  if (status !== 'reconnecting' || !reconnectTimedOut) return null;

  return (
    <div
      className="wallet-reconnect-banner"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="wallet-reconnect-banner"
    >
      {/* Spinner — decorative; hidden from AT */}
      <span className="wrb-spinner" aria-hidden="true" />

      {/* Message */}
      <span className="wrb-message">
        Reconnecting your wallet — this is taking longer than expected.
      </span>

      {/* Retry CTA */}
      <button
        type="button"
        className="wrb-btn wrb-btn--retry focus-ring"
        onClick={retryReconnect}
        aria-label="Retry wallet reconnection"
      >
        Retry
      </button>

      {/* Dismiss */}
      <button
        type="button"
        className="wrb-btn wrb-btn--dismiss focus-ring"
        onClick={dismissReconnectBanner}
        aria-label="Dismiss reconnect banner"
      >
        {/* × rendered as a real character, not an HTML entity, so it's
            announced correctly by screen readers */}
        ✕
      </button>
    </div>
  );
}
